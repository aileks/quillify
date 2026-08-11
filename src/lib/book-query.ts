import type { ReadingStatus } from '@/lib/reading-lifecycle';

export type BookSortBy = 'title' | 'author' | 'createdAt';
export type BookSortOrder = 'asc' | 'desc';

const STATUS_PARAMS: Record<string, ReadingStatus> = {
  'to-read': 'to_read',
  reading: 'reading',
  paused: 'paused',
  finished: 'finished',
  'did-not-finish': 'did_not_finish',
};

export const READING_STATUS_PARAMS: Record<ReadingStatus, string> = {
  to_read: 'to-read',
  reading: 'reading',
  paused: 'paused',
  finished: 'finished',
  did_not_finish: 'did-not-finish',
};

interface SearchParamsReader {
  get(name: string): string | null;
}

const SORT_FIELDS = new Set<BookSortBy>(['title', 'author', 'createdAt']);
const SORT_ORDERS = new Set<BookSortOrder>(['asc', 'desc']);

export function parseBookQueryParams(searchParams: SearchParamsReader) {
  const pageParam = searchParams.get('page') ?? '1';
  const parsedPage = Number(pageParam);
  const page = /^[1-9]\d*$/.test(pageParam) ? Math.min(parsedPage, Number.MAX_SAFE_INTEGER) : 1;
  const search = searchParams.get('search') ?? '';
  const genre = searchParams.get('genre')?.split(',').filter(Boolean) ?? [];
  const requestedSortBy = searchParams.get('sortBy');
  const requestedSortOrder = searchParams.get('sortOrder');
  const sortBy =
    requestedSortBy && SORT_FIELDS.has(requestedSortBy as BookSortBy) ?
      (requestedSortBy as BookSortBy)
    : 'createdAt';
  const sortOrder =
    requestedSortOrder && SORT_ORDERS.has(requestedSortOrder as BookSortOrder) ?
      (requestedSortOrder as BookSortOrder)
    : 'desc';
  const statusParam = searchParams.get('status');
  const legacyIsReadParam = searchParams.get('isRead');
  const status =
    statusParam ? STATUS_PARAMS[statusParam]
    : legacyIsReadParam === 'true' ? 'finished'
    : legacyIsReadParam === 'false' ? 'to_read'
    : undefined;

  return { page, search, genre, sortBy, sortOrder, status };
}
