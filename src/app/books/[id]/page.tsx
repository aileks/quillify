import { notFound } from 'next/navigation';
import { api } from '@/trpc/server';
import { BookDetailClient } from './book-detail-client';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;

  let book;
  try {
    book = await api.books.getById({ id });
  } catch {
    notFound();
  }

  if (!book) {
    notFound();
  }

  return <BookDetailClient bookId={id} initialBook={book} />;
}
