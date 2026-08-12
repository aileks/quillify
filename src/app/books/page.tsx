import { BooksClient } from './books-client';
import { api, HydrateClient } from '@/trpc/server';
import { parseBookQueryRecord, type BookQuerySearchParams } from '@/lib/book-query';
import { pickRandomSaying } from '@/lib/product-sayings';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

/**
 * Library catalog page - prefetches the current URL state and hydrates it into React Query.
 */
interface BooksPageProps {
  searchParams: Promise<BookQuerySearchParams>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const subtitle = pickRandomSaying('library');
  const query = parseBookQueryRecord(await searchParams);

  void api.books.list.prefetch({
    ...query,
    pageSize: 12,
  });

  return (
    <HydrateClient>
      <BooksClient subtitle={subtitle} />
    </HydrateClient>
  );
}
