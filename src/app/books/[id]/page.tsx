import { notFound, redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';
import { BookDetailClient } from './book-detail-client';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect('/');
  }

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
