import { api, HydrateClient } from '@/trpc/server';
import { BooksClient } from './books-client';

export default async function BooksPage() {
  // Fetch initial data on the server
  const initialData = await api.books.list({
    page: 1,
    pageSize: 12,
    search: '',
    isRead: undefined,
    sortBy: 'title',
    sortOrder: 'asc',
  });

  return (
    <HydrateClient>
      <BooksClient initialData={initialData} />
    </HydrateClient>
  );
}
