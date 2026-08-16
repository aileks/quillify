import { and, asc, eq, inArray, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

import type { db } from '@/server/db';
import {
  bookTags,
  books,
  listEntries,
  lists,
  readingPeriods,
  tags,
  upNextEntries,
} from '@/server/db/schema';
import { normalizeTagNames, UP_NEXT_LIMIT } from '@/lib/organization';

export type OrganizationDatabase = Pick<typeof db, 'select' | 'insert' | 'update' | 'delete'>;

/**
 * Names match case-insensitively; the first existing spelling wins.
 */
export async function resolveTags(
  tx: OrganizationDatabase,
  userId: string,
  names: readonly string[]
) {
  const normalized = normalizeTagNames(names);
  if (normalized.length === 0) return [];

  const lowered = normalized.map((name) => name.toLowerCase());

  const existing = await tx
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(sql`lower(${tags.name})`, lowered)));

  const existingKeys = new Set(existing.map((tag) => tag.name.toLowerCase()));
  const missing = normalized.filter((name) => !existingKeys.has(name.toLowerCase()));

  if (missing.length > 0) {
    await tx
      .insert(tags)
      .values(missing.map((name) => ({ userId, name })))
      .onConflictDoNothing();

    const inserted = await tx
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), inArray(sql`lower(${tags.name})`, lowered)));

    return inserted;
  }

  return existing;
}

export async function setBookTags(
  tx: OrganizationDatabase,
  userId: string,
  bookId: string,
  names: readonly string[]
) {
  const resolved = await resolveTags(tx, userId, names);

  await tx.delete(bookTags).where(eq(bookTags.bookId, bookId));

  if (resolved.length > 0) {
    await tx
      .insert(bookTags)
      .values(resolved.map((tag) => ({ bookId, tagId: tag.id })))
      .onConflictDoNothing();
  }

  return resolved.map((tag) => tag.name).sort((a, b) => a.localeCompare(b));
}

export async function getBookTagNames(
  database: Pick<typeof db, 'select'>,
  userId: string,
  bookId: string
) {
  const rows = await database
    .select({ name: tags.name })
    .from(bookTags)
    .innerJoin(tags, eq(bookTags.tagId, tags.id))
    .innerJoin(books, eq(bookTags.bookId, books.id))
    .where(and(eq(books.userId, userId), eq(bookTags.bookId, bookId)))
    .orderBy(asc(sql`lower(${tags.name})`));

  return rows.map((row) => row.name);
}

export async function addTagsToBooks(
  tx: OrganizationDatabase,
  userId: string,
  bookIds: readonly string[],
  names: readonly string[]
) {
  const resolved = await resolveTags(tx, userId, names);
  if (resolved.length === 0 || bookIds.length === 0) return;

  await tx
    .insert(bookTags)
    .values(bookIds.flatMap((bookId) => resolved.map((tag) => ({ bookId, tagId: tag.id }))))
    .onConflictDoNothing();
}

export async function removeTagsFromBooks(
  tx: OrganizationDatabase,
  userId: string,
  bookIds: readonly string[],
  names: readonly string[]
) {
  const normalized = normalizeTagNames(names);
  if (normalized.length === 0 || bookIds.length === 0) return;

  const lowered = normalized.map((name) => name.toLowerCase());
  const owned = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), inArray(sql`lower(${tags.name})`, lowered)));

  if (owned.length === 0) return;

  const ids = [...bookIds];
  const tagIds = owned.map((tag) => tag.id);

  await tx
    .delete(bookTags)
    .where(and(inArray(bookTags.bookId, ids), inArray(bookTags.tagId, tagIds)));
}

export async function assertBooksOwned(
  tx: OrganizationDatabase,
  userId: string,
  bookIds: readonly string[]
) {
  const uniqueIds = [...new Set(bookIds)];
  if (uniqueIds.length === 0) return;

  const [owned] = await tx
    .select({ total: count() })
    .from(books)
    .where(and(eq(books.userId, userId), inArray(books.id, uniqueIds)));

  if (!owned || owned.total !== uniqueIds.length) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
}

export async function getOwnedList(tx: OrganizationDatabase, userId: string, listId: string) {
  const [list] = await tx
    .select()
    .from(lists)
    .where(and(eq(lists.id, listId), eq(lists.userId, userId)));

  if (!list) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return list;
}

async function resequenceListEntries(tx: OrganizationDatabase, listId: string) {
  const entries = await tx
    .select({ id: listEntries.id })
    .from(listEntries)
    .where(eq(listEntries.listId, listId))
    .orderBy(asc(listEntries.position), asc(listEntries.createdAt));

  for (const [index, entry] of entries.entries()) {
    const position = index + 1;
    await tx.update(listEntries).set({ position }).where(eq(listEntries.id, entry.id));
  }
}

export async function addBooksToList(
  tx: OrganizationDatabase,
  userId: string,
  listId: string,
  bookIds: readonly string[]
) {
  await getOwnedList(tx, userId, listId);
  await assertBooksOwned(tx, userId, bookIds);

  const uniqueIds = [...new Set(bookIds)];
  if (uniqueIds.length === 0) return;

  const [last] = await tx
    .select({ maxPosition: sql<number | null>`MAX(${listEntries.position})`.mapWith(Number) })
    .from(listEntries)
    .where(eq(listEntries.listId, listId));

  let nextPosition = (last?.maxPosition ?? 0) + 1;
  for (const bookId of uniqueIds) {
    const inserted = await tx
      .insert(listEntries)
      .values({ listId, bookId, position: nextPosition })
      .onConflictDoNothing()
      .returning({ id: listEntries.id });

    if (inserted.length > 0) {
      nextPosition += 1;
    }
  }

  await tx.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId));
}

export async function removeBooksFromList(
  tx: OrganizationDatabase,
  userId: string,
  listId: string,
  bookIds: readonly string[]
) {
  await getOwnedList(tx, userId, listId);

  const uniqueIds = [...new Set(bookIds)];
  if (uniqueIds.length === 0) return;

  await tx
    .delete(listEntries)
    .where(and(eq(listEntries.listId, listId), inArray(listEntries.bookId, uniqueIds)));

  await resequenceListEntries(tx, listId);
  await tx.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, listId));
}

export async function moveListEntry(
  tx: OrganizationDatabase,
  userId: string,
  listId: string,
  entryId: string,
  direction: 'up' | 'down'
) {
  await getOwnedList(tx, userId, listId);

  const entries = await tx
    .select()
    .from(listEntries)
    .where(eq(listEntries.listId, listId))
    .orderBy(asc(listEntries.position), asc(listEntries.createdAt));

  const index = entries.findIndex((entry) => entry.id === entryId);
  if (index === -1) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= entries.length) return;

  const entry = entries[index]!;
  const neighbor = entries[neighborIndex]!;

  await tx.update(listEntries).set({ position: -1 }).where(eq(listEntries.id, entry.id));
  await tx
    .update(listEntries)
    .set({ position: entry.position })
    .where(eq(listEntries.id, neighbor.id));
  await tx
    .update(listEntries)
    .set({ position: neighbor.position })
    .where(eq(listEntries.id, entry.id));
}

export async function addToUpNext(tx: OrganizationDatabase, userId: string, bookId: string) {
  const [queued] = await tx
    .select({ total: count() })
    .from(upNextEntries)
    .where(eq(upNextEntries.userId, userId));

  if (queued && queued.total >= UP_NEXT_LIMIT) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'UP_NEXT_FULL' });
  }

  const [last] = await tx
    .select({ maxPosition: sql<number | null>`MAX(${upNextEntries.position})`.mapWith(Number) })
    .from(upNextEntries)
    .where(eq(upNextEntries.userId, userId));

  await tx
    .insert(upNextEntries)
    .values({ userId, bookId, position: (last?.maxPosition ?? 0) + 1 })
    .onConflictDoNothing();
}

export async function removeFromUpNext(tx: OrganizationDatabase, userId: string, bookId: string) {
  await tx
    .delete(upNextEntries)
    .where(and(eq(upNextEntries.userId, userId), eq(upNextEntries.bookId, bookId)));

  await resequenceUpNext(tx, userId);
}

export async function moveUpNextEntry(
  tx: OrganizationDatabase,
  userId: string,
  bookId: string,
  direction: 'up' | 'down'
) {
  const entries = await tx
    .select()
    .from(upNextEntries)
    .where(eq(upNextEntries.userId, userId))
    .orderBy(asc(upNextEntries.position), asc(upNextEntries.createdAt));

  const index = entries.findIndex((entry) => entry.bookId === bookId);
  if (index === -1) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  const neighborIndex = direction === 'up' ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= entries.length) return;

  const entry = entries[index]!;
  const neighbor = entries[neighborIndex]!;

  await tx.update(upNextEntries).set({ position: -1 }).where(eq(upNextEntries.id, entry.id));
  await tx
    .update(upNextEntries)
    .set({ position: entry.position })
    .where(eq(upNextEntries.id, neighbor.id));
  await tx
    .update(upNextEntries)
    .set({ position: neighbor.position })
    .where(eq(upNextEntries.id, entry.id));
}

async function resequenceUpNext(tx: OrganizationDatabase, userId: string) {
  const entries = await tx
    .select({ id: upNextEntries.id })
    .from(upNextEntries)
    .where(eq(upNextEntries.userId, userId))
    .orderBy(asc(upNextEntries.position), asc(upNextEntries.createdAt));

  for (const [index, entry] of entries.entries()) {
    const position = index + 1;
    await tx.update(upNextEntries).set({ position }).where(eq(upNextEntries.id, entry.id));
  }
}

export async function evictFromUpNextIfDeparting(
  tx: OrganizationDatabase,
  bookId: string,
  nextStatus: string
) {
  if (nextStatus === 'to_read') return;

  const [existing] = await tx
    .select({ userId: upNextEntries.userId })
    .from(upNextEntries)
    .where(eq(upNextEntries.bookId, bookId));

  if (!existing) return;

  await tx.delete(upNextEntries).where(eq(upNextEntries.bookId, bookId));
  await resequenceUpNext(tx, existing.userId);
}

export async function getCurrentReadingStatusForBook(
  tx: OrganizationDatabase,
  userId: string,
  bookId: string
) {
  const [row] = await tx
    .select({ status: readingPeriods.status })
    .from(books)
    .innerJoin(
      readingPeriods,
      and(eq(readingPeriods.bookId, books.id), eq(readingPeriods.isCurrent, true))
    )
    .where(and(eq(books.id, bookId), eq(books.userId, userId)));

  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return row.status;
}
