'use client';

import Link from 'next/link';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Loading from './loading';

export default function BooksPage() {
  const { data: books, isLoading, error } = api.books.list.useQuery();

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-destructive font-semibold'>Error: {error.message}</p>
            <p className='text-muted-foreground text-sm'>Are you signed in?</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>My Books</h1>
          <p className='text-muted-foreground'>
            {books?.length === 0 ?
              'No books yet'
            : `${books?.length} book${books?.length === 1 ? '' : 's'} in your collection`}
          </p>
        </div>
        <Button asChild>
          <Link href='/books/new'>Add Book</Link>
        </Button>
      </div>

      {!books?.length ?
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground mb-4 text-center'>
              You haven&apos;t added any books yet. Start building your library!
            </p>
            <Button asChild>
              <Link href='/books/new'>Add Your First Book</Link>
            </Button>
          </CardContent>
        </Card>
      : <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className='group'>
              <Card className='h-full transition-shadow hover:shadow-lg'>
                <CardHeader>
                  <CardTitle className='group-hover:text-primary line-clamp-2 transition-colors'>
                    {book.title}
                  </CardTitle>
                  <CardDescription className='line-clamp-1'>by {book.author}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Pages:</span>
                      <span className='font-medium'>{book.numberOfPages}</span>
                    </div>
                    {book.genre && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Genre:</span>
                        <span className='font-medium'>{book.genre}</span>
                      </div>
                    )}
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Published:</span>
                      <span className='font-medium'>{book.publishYear}</span>
                    </div>
                    <div className='flex justify-between pt-2'>
                      <span className='text-muted-foreground'>Status:</span>
                      <span
                        className={`font-medium ${
                          book.isRead ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {book.isRead ? '✓ Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      }
    </div>
  );
}
