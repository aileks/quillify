import 'server-only';

import { parse } from 'csv-parse/sync';
import { z } from 'zod';

import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_MAX_PAGE_COUNT,
  BOOK_MIN_PUBLISH_YEAR,
  BOOK_TITLE_MAX_LENGTH,
  getMaximumPublishYear,
} from '@/lib/book-validation';
import { normalizeIsbn } from '@/lib/isbn';
import { BOOK_TAGS_MAX_COUNT, TAG_NAME_MAX_LENGTH } from '@/lib/organization';
import { READING_FORMATS } from '@/lib/reading-lifecycle';

export const GOODREADS_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const GOODREADS_MAX_RECORDS = 10_000;

const REQUIRED_HEADERS = [
  'Book Id',
  'Title',
  'Author',
  'Number of Pages',
  'Year Published',
  'Exclusive Shelf',
] as const;

const goodreadsReadingStatusSchema = z.enum(['to_read', 'reading', 'finished']);
const nullableReadingFormatSchema = z.union([z.enum(READING_FORMATS), z.null()]);

export const goodreadsImportRowSchema = z.object({
  sourceRecordId: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(BOOK_TITLE_MAX_LENGTH),
  author: z.string().trim().min(1).max(BOOK_AUTHOR_MAX_LENGTH),
  numberOfPages: z.number().int().min(1).max(BOOK_MAX_PAGE_COUNT),
  publishYear: z.number().int().min(BOOK_MIN_PUBLISH_YEAR).max(getMaximumPublishYear()),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
  readingStatus: goodreadsReadingStatusSchema,
  readingFormat: nullableReadingFormatSchema,
  endedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  ownershipType: z.enum(['owned', 'unknown']),
  tags: z.array(z.string().trim().min(1).max(TAG_NAME_MAX_LENGTH)).max(BOOK_TAGS_MAX_COUNT),
  importAsSeparateEdition: z.boolean().default(false),
});

export type GoodreadsImportRow = z.infer<typeof goodreadsImportRowSchema>;
export type GoodreadsPreviewStatus =
  'ready' | 'needs_attention' | 'likely_duplicate' | 'already_imported' | 'invalid';

export interface GoodreadsPreviewRow {
  rowNumber: number;
  sourceRecordId: string;
  title: string;
  author: string;
  numberOfPages: number | null;
  publishYear: number | null;
  isbn10: string | null;
  isbn13: string | null;
  readingStatus: 'to_read' | 'reading' | 'finished';
  readingFormat: (typeof READING_FORMATS)[number] | null;
  endedOn: string | null;
  ownershipType: 'owned' | 'unknown';
  tags: string[];
  issues: string[];
  previewStatus: GoodreadsPreviewStatus;
}

function parsePositiveInteger(value: string, maximum: number): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : null;
}

function parsePublishYear(primaryValue: string, fallbackValue: string): number | null {
  const value = primaryValue || fallbackValue;
  return (
      parsePositiveInteger(value, getMaximumPublishYear()) && Number(value) >= BOOK_MIN_PUBLISH_YEAR
    ) ?
      Number(value)
    : null;
}

export function mapGoodreadsShelf(value: string): GoodreadsPreviewRow['readingStatus'] | null {
  const shelf = value.trim().toLowerCase();
  if (shelf === 'read') return 'finished';
  if (shelf === 'currently-reading') return 'reading';
  if (shelf === 'to-read') return 'to_read';
  return null;
}

const EXCLUSIVE_SHELVES = new Set(['read', 'currently-reading', 'to-read']);

/**
 * The exclusive shelves map to reading states instead and never become tags.
 */
export function parseGoodreadsBookshelves(value: string): string[] {
  const shelves = value
    .split(',')
    .map((shelf) => shelf.trim().toLowerCase())
    .filter(
      (shelf) =>
        shelf.length > 0 && shelf.length <= TAG_NAME_MAX_LENGTH && !EXCLUSIVE_SHELVES.has(shelf)
    );

  return [...new Set(shelves)].slice(0, BOOK_TAGS_MAX_COUNT);
}

export function mapGoodreadsBinding(value: string): GoodreadsPreviewRow['readingFormat'] {
  const binding = value.trim().toLowerCase();
  if (/audio/.test(binding)) return 'audiobook';
  if (/kindle|e-?book|digital/.test(binding)) return 'ebook';
  if (/paperback|hardcover|hardback|mass market|print/.test(binding)) return 'print';
  return null;
}

export function normalizeGoodreadsDate(value: string): string | null {
  const match = /^(\d{4})[/-](\d{2})[/-](\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function parseRecord(
  record: Record<string, string>,
  index: number,
  repeatedSourceIds: Set<string>
): GoodreadsPreviewRow {
  const sourceRecordId = record['Book Id']?.trim() ?? '';
  const title = record['Title']?.trim() ?? '';
  const author = record['Author']?.trim() ?? '';
  const numberOfPages = parsePositiveInteger(
    record['Number of Pages']?.trim() ?? '',
    BOOK_MAX_PAGE_COUNT
  );
  const publishYear = parsePublishYear(
    record['Year Published']?.trim() ?? '',
    record['Original Publication Year']?.trim() ?? ''
  );
  const readingStatus = mapGoodreadsShelf(record['Exclusive Shelf'] ?? '') ?? 'to_read';
  const rawIsbn = record['ISBN13']?.trim() || record['ISBN']?.trim() || '';
  const normalizedIsbn = rawIsbn ? normalizeIsbn(rawIsbn) : null;
  const rawDateRead = record['Date Read']?.trim() ?? '';
  const endedOn = readingStatus === 'finished' ? normalizeGoodreadsDate(rawDateRead) : null;
  const issues: string[] = [];

  if (!sourceRecordId) issues.push('Missing Goodreads Book ID');
  if (!title) issues.push('Missing title');
  if (title.length > BOOK_TITLE_MAX_LENGTH) issues.push('Title is too long');
  if (!author) issues.push('Missing author');
  if (author.length > BOOK_AUTHOR_MAX_LENGTH) issues.push('Author is too long');
  if (!mapGoodreadsShelf(record['Exclusive Shelf'] ?? '')) issues.push('Unsupported shelf');
  if (rawIsbn && !normalizedIsbn) issues.push('Invalid ISBN');
  if (rawDateRead && readingStatus === 'finished' && !endedOn) issues.push('Invalid date read');
  if (sourceRecordId && repeatedSourceIds.has(sourceRecordId)) {
    issues.push('Repeated Goodreads Book ID');
  }
  if (sourceRecordId) repeatedSourceIds.add(sourceRecordId);

  const hasInvalidIssue = issues.length > 0;
  if (numberOfPages === null) issues.push('Enter a page count');
  if (publishYear === null) issues.push('Enter a publication year');

  return {
    rowNumber: index + 2,
    sourceRecordId,
    title,
    author,
    numberOfPages,
    publishYear,
    isbn10: normalizedIsbn?.isbn10 ?? null,
    isbn13: normalizedIsbn?.isbn13 ?? null,
    readingStatus,
    readingFormat: mapGoodreadsBinding(record['Binding'] ?? ''),
    endedOn,
    ownershipType: Number(record['Owned Copies'] ?? 0) > 0 ? 'owned' : 'unknown',
    tags: parseGoodreadsBookshelves(record['Bookshelves'] ?? ''),
    issues,
    previewStatus:
      hasInvalidIssue ? 'invalid'
      : numberOfPages === null || publishYear === null ? 'needs_attention'
      : 'ready',
  };
}

export function parseGoodreadsCsv(csv: string): GoodreadsPreviewRow[] {
  if (Buffer.byteLength(csv, 'utf8') > GOODREADS_MAX_FILE_BYTES) {
    throw new Error('Goodreads CSV must be 5 MiB or smaller');
  }

  let headers: string[] = [];
  let records: Record<string, string>[];
  try {
    records = parse(csv, {
      bom: true,
      columns(header) {
        headers = header;
        return header;
      },
      relax_column_count: false,
      relax_quotes: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    throw new Error('Could not parse the Goodreads CSV');
  }

  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing Goodreads headers: ${missingHeaders.join(', ')}`);
  }
  if (records.length > GOODREADS_MAX_RECORDS) {
    throw new Error(`Goodreads CSV cannot contain more than ${GOODREADS_MAX_RECORDS} books`);
  }

  const repeatedSourceIds = new Set<string>();
  return records.map((record, index) => parseRecord(record, index, repeatedSourceIds));
}
