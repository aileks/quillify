import { z } from 'zod';

import {
  OWNERSHIP_TYPES,
  READING_FORMATS,
  READING_STATUSES,
  ownershipTypeSchema,
  readingPeriodFieldsSchema,
} from '@/lib/reading-lifecycle';
import { normalizeIsbn } from '@/lib/isbn';
import { BOOK_TAGS_MAX_COUNT, tagNameSchema, tagNamesSchema } from '@/lib/organization';

export const BOOK_TITLE_MAX_LENGTH = 200;
export const BOOK_AUTHOR_MAX_LENGTH = 120;
export const BOOK_GENRE_MAX_LENGTH = 80;
export const BOOK_MIN_PUBLISH_YEAR = 1000;
export const BOOK_MAX_PAGE_COUNT = 100_000;
export const BOOK_COVER_SOURCE = 'open_library';

const coverSourceSchema = z.literal(BOOK_COVER_SOURCE).nullable().optional();
const coverSourceIdSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Cover ID must be numeric')
  .nullable()
  .optional();
const isbn10Schema = z
  .string()
  .refine((value) => normalizeIsbn(value)?.isbn10 === value, 'Invalid ISBN-10')
  .nullable()
  .optional();
const isbn13Schema = z
  .string()
  .refine((value) => normalizeIsbn(value)?.isbn13 === value, 'Invalid ISBN-13')
  .nullable()
  .optional();
const openLibraryWorkIdSchema = z
  .string()
  .regex(/^OL\d+W$/, 'Invalid Open Library work ID')
  .nullable()
  .optional();
const openLibraryEditionIdSchema = z
  .string()
  .regex(/^OL\d+M$/, 'Invalid Open Library edition ID')
  .nullable()
  .optional();

function validateCoverSelection(
  values: {
    coverSource?: typeof BOOK_COVER_SOURCE | null;
    coverSourceId?: string | null;
  },
  context: z.core.$RefinementCtx
) {
  const hasSource = values.coverSource === BOOK_COVER_SOURCE;
  const hasSourceId = typeof values.coverSourceId === 'string';

  if (hasSource === hasSourceId) {
    return;
  }

  context.addIssue({
    code: 'custom',
    message: 'Cover source and cover ID must be selected together',
    path: hasSource ? ['coverSourceId'] : ['coverSource'],
  });
}

export function getMaximumPublishYear(referenceDate = new Date()): number {
  return referenceDate.getFullYear() + 5;
}

const bookFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(BOOK_TITLE_MAX_LENGTH),
  author: z.string().trim().min(1, 'Author is required').max(BOOK_AUTHOR_MAX_LENGTH),
  numberOfPages: z.number().int().min(1).max(BOOK_MAX_PAGE_COUNT),
  genre: z.string().trim().max(BOOK_GENRE_MAX_LENGTH).optional(),
  publishYear: z.number().int().min(BOOK_MIN_PUBLISH_YEAR).max(getMaximumPublishYear()),
  coverSource: coverSourceSchema,
  coverSourceId: coverSourceIdSchema,
  isbn10: isbn10Schema,
  isbn13: isbn13Schema,
  openLibraryWorkId: openLibraryWorkIdSchema,
  openLibraryEditionId: openLibraryEditionIdSchema,
});

export const bookInputSchema = bookFieldsSchema.superRefine(validateCoverSelection);

export const bookCreateInputSchema = z.intersection(
  bookInputSchema,
  z.object({
    ownershipType: ownershipTypeSchema.default('unknown'),
    readingDetails: readingPeriodFieldsSchema.optional(),
    tags: tagNamesSchema.optional(),
  })
);

export const bookUpdateInputSchema = bookFieldsSchema
  .partial()
  .extend({
    id: z.string().min(1),
  })
  .superRefine((values, context) => {
    const updatesCoverSource = values.coverSource !== undefined;
    const updatesCoverSourceId = values.coverSourceId !== undefined;

    if (!updatesCoverSource && !updatesCoverSourceId) {
      return;
    }

    if (!updatesCoverSource || !updatesCoverSourceId) {
      context.addIssue({
        code: 'custom',
        message: 'Cover source and cover ID must be updated together',
        path: updatesCoverSource ? ['coverSourceId'] : ['coverSource'],
      });
      return;
    }

    validateCoverSelection(values, context);
  });

export const bookMetadataUpdateInputSchema = z.intersection(
  bookUpdateInputSchema,
  z.object({
    ownershipType: ownershipTypeSchema.optional(),
    readingDetails: readingPeriodFieldsSchema.optional(),
    tags: tagNamesSchema.optional(),
  })
);

export const bookFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(BOOK_TITLE_MAX_LENGTH),
    author: z.string().trim().min(1, 'Author is required').max(BOOK_AUTHOR_MAX_LENGTH),
    numberOfPages: z
      .string()
      .trim()
      .min(1, 'Number of pages is required')
      .refine(
        (value) => {
          const pages = Number(value);
          return Number.isInteger(pages) && pages >= 1 && pages <= BOOK_MAX_PAGE_COUNT;
        },
        { message: `Pages must be between 1 and ${BOOK_MAX_PAGE_COUNT.toLocaleString()}` }
      ),
    publishYear: z
      .string()
      .trim()
      .min(1, 'Publication year is required')
      .refine(
        (value) => {
          const year = Number(value);
          return (
            Number.isInteger(year) &&
            year >= BOOK_MIN_PUBLISH_YEAR &&
            year <= getMaximumPublishYear()
          );
        },
        {
          message: `Year must be between ${BOOK_MIN_PUBLISH_YEAR} and ${getMaximumPublishYear()}`,
        }
      ),
    genre: z.string().trim().max(BOOK_GENRE_MAX_LENGTH).optional(),
    coverSource: coverSourceSchema,
    coverSourceId: coverSourceIdSchema,
    isbn: z
      .string()
      .trim()
      .max(32)
      .refine((value) => value.length === 0 || normalizeIsbn(value) !== null, 'Enter a valid ISBN'),
    catalogIsbns: z.array(z.string()),
    openLibraryWorkId: openLibraryWorkIdSchema,
    openLibraryEditionId: openLibraryEditionIdSchema,
    ownershipType: z.enum(OWNERSHIP_TYPES),
    tags: z.array(tagNameSchema).max(BOOK_TAGS_MAX_COUNT),
    includeReadingDetails: z.boolean(),
    readingStatus: z.enum(READING_STATUSES),
    readingFormat: z.union([z.enum(READING_FORMATS), z.literal('')]),
    startedOn: z.string(),
    endedOn: z.string(),
  })
  .superRefine((values, context) => {
    validateCoverSelection(values, context);

    if (!values.includeReadingDetails) {
      return;
    }

    const readingDetails = readingPeriodFieldsSchema.safeParse({
      status: values.readingStatus,
      format: values.readingFormat || null,
      startedOn: values.startedOn || null,
      endedOn: values.endedOn || null,
    });
    if (readingDetails.success) {
      return;
    }

    for (const issue of readingDetails.error.issues) {
      const field = issue.path[0] ?? 'readingStatus';
      context.addIssue({
        code: 'custom',
        message: issue.message,
        path: [field === 'status' ? 'readingStatus' : field],
      });
    }
  });

export type BookInput = z.infer<typeof bookInputSchema>;
export type BookCreateInput = z.infer<typeof bookCreateInputSchema>;
export type BookFormValues = z.infer<typeof bookFormSchema>;

export function toBookInput(values: BookFormValues): BookCreateInput {
  const normalizedIsbn = normalizeIsbn(values.isbn);
  const selectedEditionIsbns = new Set(
    values.catalogIsbns.flatMap((isbn) => {
      const normalized = normalizeIsbn(isbn);
      return normalized ? [normalized.isbn13] : [];
    })
  );
  const retainsSelectedEdition =
    normalizedIsbn !== null && selectedEditionIsbns.has(normalizedIsbn.isbn13);

  return bookCreateInputSchema.parse({
    title: values.title,
    author: values.author,
    numberOfPages: Number(values.numberOfPages),
    publishYear: Number(values.publishYear),
    genre: values.genre || 'Other',
    coverSource: values.coverSource ?? null,
    coverSourceId: values.coverSourceId ?? null,
    isbn10: normalizedIsbn?.isbn10 ?? null,
    isbn13: normalizedIsbn?.isbn13 ?? null,
    openLibraryWorkId: values.openLibraryWorkId ?? null,
    openLibraryEditionId: retainsSelectedEdition ? values.openLibraryEditionId : null,
    ownershipType: values.ownershipType,
    tags: values.tags,
    readingDetails:
      values.includeReadingDetails ?
        {
          status: values.readingStatus,
          format: values.readingFormat || null,
          startedOn: values.startedOn || null,
          endedOn: values.endedOn || null,
        }
      : undefined,
  });
}
