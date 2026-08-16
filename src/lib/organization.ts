import { z } from 'zod';

export const TAG_NAME_MAX_LENGTH = 40;
export const LIST_NAME_MAX_LENGTH = 60;
export const UP_NEXT_LIMIT = 5;
export const BOOK_TAGS_MAX_COUNT = 50;
export const BULK_BOOK_IDS_MAX = 100;

export const tagNameSchema = z.string().trim().min(1).max(TAG_NAME_MAX_LENGTH);
export const tagNamesSchema = z
  .array(tagNameSchema)
  .max(BOOK_TAGS_MAX_COUNT, `A book can have at most ${BOOK_TAGS_MAX_COUNT} tags`);
export const listNameSchema = z.string().trim().min(1).max(LIST_NAME_MAX_LENGTH);

export function normalizeTagNames(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(name);
  }

  return normalized;
}

export const moveDirectionSchema = z.enum(['up', 'down']);
export type MoveDirection = z.infer<typeof moveDirectionSchema>;
