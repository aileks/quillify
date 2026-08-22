import type { ReadingStatus } from '@/lib/reading-lifecycle';

export type BookSortBy = 'title' | 'author' | 'createdAt';
export type BookSortOrder = 'asc' | 'desc';

/** Translate a `status` URL parameter into a reading status. */
export function parseStatusParam(param: string | null | undefined): ReadingStatus | undefined {
  switch (param) {
    case 'to-read':
      return 'to_read';
    case 'reading':
      return 'reading';
    case 'paused':
      return 'paused';
    case 'finished':
      return 'finished';
    case 'did-not-finish':
      return 'did_not_finish';
    default:
      return undefined;
  }
}

export const READING_STATUS_PARAMS = {
  to_read: 'to-read',
  reading: 'reading',
  paused: 'paused',
  finished: 'finished',
  did_not_finish: 'did-not-finish',
} satisfies Record<ReadingStatus, string>;

interface SearchParamsReader {
  get(name: string): string | null;
}

export type BookQuerySearchParams = Record<string, string | string[] | undefined>;

const SORT_FIELDS = ['title', 'author', 'createdAt'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export function parseBookQueryParams(searchParams: SearchParamsReader) {
  const pageParam = searchParams.get('page') ?? '1';
  const parsedPage = Number(pageParam);
  const page = /^[1-9]\d*$/.test(pageParam) ? Math.min(parsedPage, Number.MAX_SAFE_INTEGER) : 1;
  const search = searchParams.get('search') ?? '';
  const genre = searchParams.get('genre')?.split(',').filter(Boolean) ?? [];
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const requestedSortBy = searchParams.get('sortBy');
  const requestedSortOrder = searchParams.get('sortOrder');
  const sortBy =
    (requestedSortBy ? SORT_FIELDS.find((field) => field === requestedSortBy) : undefined) ??
    'createdAt';
  const sortOrder =
    (requestedSortOrder ? SORT_ORDERS.find((order) => order === requestedSortOrder) : undefined) ??
    'desc';
  const statusParam = searchParams.get('status');
  const legacyIsReadParam = searchParams.get('isRead');
  const status =
    parseStatusParam(statusParam) ??
    (legacyIsReadParam === 'true' ? 'finished'
    : legacyIsReadParam === 'false' ? 'to_read'
    : undefined);

  return { page, search, genre, tags, sortBy, sortOrder, status };
}

export function parseBookQueryRecord(searchParams: BookQuerySearchParams) {
  return parseBookQueryParams({
    get(name) {
      const value = searchParams[name];
      return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
    },
  });
}
