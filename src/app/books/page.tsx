'use client';

import { useState } from 'react';
import { api } from '@/trpc/react';

export default function BooksPage() {
  const utils = api.useUtils();

  // Queries
  const { data: books, isLoading, error } = api.books.list.useQuery();

  // Mutations
  const create = api.books.create.useMutation({
    onSuccess: () => void utils.books.list.invalidate(),
  });
  const setRead = api.books.setRead.useMutation({
    onSuccess: () => void utils.books.list.invalidate(),
  });
  const remove = api.books.remove.useMutation({
    onSuccess: () => void utils.books.list.invalidate(),
  });

  // Local form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState<number>(300);

  if (isLoading) return <div className='p-6'>Loading…</div>;
  if (error) {
    // If not signed in, protectedProcedure will throw UNAUTHORIZED
    return (
      <div className='p-6'>
        <p className='text-red-600'>Error: {error.message}</p>
        <p className='text-sm text-zinc-600'>Are you signed in?</p>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-2xl space-y-6 p-6'>
      <h1 className='text-2xl font-bold'>My Books</h1>

      {/* Create form */}
      <form
        className='flex flex-wrap items-end gap-2'
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ title, author, numberOfPages: pages });
        }}
      >
        <label className='flex flex-col'>
          <span className='text-sm text-zinc-600'>Title</span>
          <input
            className='rounded border px-2 py-1'
            placeholder='The Pragmatic Programmer'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className='flex flex-col'>
          <span className='text-sm text-zinc-600'>Author</span>
          <input
            className='rounded border px-2 py-1'
            placeholder='Andrew Hunt'
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </label>
        <label className='flex flex-col'>
          <span className='text-sm text-zinc-600'>Pages</span>
          <input
            className='w-24 rounded border px-2 py-1'
            type='number'
            min={1}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            required
          />
        </label>
        <button
          className='rounded bg-black px-3 py-2 text-white disabled:opacity-50'
          type='submit'
          disabled={create.isPending}
        >
          {create.isPending ? 'Adding…' : 'Add Book'}
        </button>
      </form>

      {/* List */}
      {!books?.length ?
        <p className='text-zinc-600'>No books yet</p>
      : <ul className='space-y-2'>
          {books.map((b) => (
            <li key={b.id} className='flex items-center justify-between rounded border p-2'>
              <div>
                <div className={b.isRead ? 'line-through' : ''}>
                  <strong>{b.title}</strong> by {b.author}
                </div>
                <div className='text-sm text-zinc-500'>{b.numberOfPages} pages</div>
              </div>
              <div className='flex gap-2'>
                <button
                  className='rounded border px-2 py-1'
                  onClick={() => setRead.mutate({ id: b.id, isRead: !b.isRead })}
                  disabled={setRead.isPending}
                >
                  Mark {b.isRead ? 'Unread' : 'Read'}
                </button>
                <button
                  className='rounded bg-red-600 px-2 py-1 text-white disabled:opacity-50'
                  onClick={() => remove.mutate({ id: b.id })}
                  disabled={remove.isPending}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
