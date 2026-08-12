import { api, HydrateClient } from '@/trpc/server';
import { pickRandomSaying } from '@/lib/product-sayings';
import { BookDetailClient } from './book-detail-client';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Book detail page - prefetches the owned book and hydrates it into the client cache.
 *
 * 404 handling is done client-side in BookDetailClient.
 */
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  await api.books.getById.prefetch({ id });

  return (
    <HydrateClient>
      <BookDetailClient bookId={id} editSaying={pickRandomSaying('editBook')} />
    </HydrateClient>
  );
}
