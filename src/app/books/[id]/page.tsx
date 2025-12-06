import { notFound } from 'next/navigation';
import { api, HydrateClient } from '@/trpc/server';
import { BookDetailClient } from './book-detail-client';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  // Prefetch into the cache - this hydrates the data to the client
  // preventing a duplicate fetch on the client side
  void api.books.getById.prefetch({ id });

  // Still need to fetch to check if book exists for notFound()
  let book;
  try {
    book = await api.books.getById({ id });
  } catch {
    notFound();
  }

  if (!book) {
    notFound();
  }

  return (
    <HydrateClient>
      <BookDetailClient bookId={id} />
    </HydrateClient>
  );
}
