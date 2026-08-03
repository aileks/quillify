export type BookSortBy = 'title' | 'author' | 'createdAt';
export type BookSortOrder = 'asc' | 'desc';

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
  const isReadParam = searchParams.get('isRead');
  const isRead =
    isReadParam === 'true' ? true
    : isReadParam === 'false' ? false
    : undefined;

  return { page, search, genre, sortBy, sortOrder, isRead };
}
