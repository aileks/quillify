'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function BooksPage() {
  const [search, setSearch] = useState('');
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);
  const [sortBy] = useState<'title' | 'author' | 'createdAt'>('title');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading } = api.books.list.useQuery({
    search,
    isRead,
    sortBy,
    sortOrder,
    page,
    pageSize,
  });

  const books = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className='container mx-auto space-y-6 px-4 py-6 md:px-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='text-3xl font-bold'>My Books</h1>
          <p className='text-muted-foreground'>
            {totalCount === 0 ?
              'No books yet'
            : `${totalCount} book${totalCount === 1 ? '' : 's'} in your collection`}
          </p>
        </div>
        <Button asChild className='w-full sm:w-auto'>
          <Link href='/books/new'>Add Book</Link>
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className='pt-6'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='sm:col-span-2'>
              <Input
                placeholder='Search books by title, author, or genre...'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
                className='w-full'
              />
            </div>
            <Select
              value={
                isRead === undefined ? 'all'
                : isRead ?
                  'read'
                : 'unread'
              }
              onValueChange={(value) => {
                setIsRead(value === 'all' ? undefined : value === 'read');
                setPage(1); // Reset to first page on filter change
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Books</SelectItem>
                <SelectItem value='read'>Read</SelectItem>
                <SelectItem value='unread'>Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className='h-full'>
              <CardHeader>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-full' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && books.length === 0 && (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-8 md:py-12'>
            <p className='text-muted-foreground mb-4 text-center'>
              {search || isRead !== undefined ?
                'No books found matching your filters.'
              : "You haven't added any books yet. Start building your library!"}
            </p>
            {!search && isRead === undefined && (
              <Button asChild className='w-full sm:w-auto'>
                <Link href='/books/new'>Add Your First Book</Link>
              </Button>
            )}
            {(search || isRead !== undefined) && (
              <Button
                variant='outline'
                onClick={() => {
                  setSearch('');
                  setIsRead(undefined);
                  setPage(1);
                }}
                className='w-full sm:w-auto'
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!isLoading && books.length > 0 && totalPages > 1 && (
        <div className='flex flex-col items-center gap-4 justify-end sm:flex-row'>
          <p className='text-muted-foreground font-bold'>
            Page {page} of {totalPages}
          </p>

          <div className='flex gap-2'>
            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='w-24 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </Button>

            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='w-24 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Books Grid */}
      {!isLoading && books.length > 0 && (
        <>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
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
        </>
      )}
    </div>
  );
}
