import { BooksClient } from './books-client';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

/**
 * Library catalog page - relies on client-side data fetching and caching.
 *
 * Data is fetched client-side via React Query, which caches results for
 * instant subsequent navigations within the staleTime window.
 */
export default function BooksPage() {
  return <BooksClient />;
}
