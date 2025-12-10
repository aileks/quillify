import { HydrateClient } from '@/trpc/server';
import { BookDetailClient } from './book-detail-client';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Book detail page - relies on client-side data fetching and caching.
 *
 * When navigating from the library/dashboard, data is already prefetched
 * in the client cache, making navigation instant. For direct URL access,
 * the client component fetches on mount.
 *
 * 404 handling is done client-side in BookDetailClient.
 */
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  return (
    <HydrateClient>
      <BookDetailClient bookId={id} />
    </HydrateClient>
  );
}
