import { BooksClient } from './books-client';
import { api, HydrateClient } from '@/trpc/server';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

/**
 * Library catalog page - relies on client-side data fetching and caching.
 *
 * Data is fetched client-side via React Query, which caches results for
 * instant subsequent navigations within the staleTime window.
 */
export default function BooksPage() {
  void api.books.list.prefetch({
    page: 1,
    pageSize: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return (
    <HydrateClient>
      <BooksClient />
    </HydrateClient>
  );
}
