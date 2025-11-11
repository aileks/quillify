'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  const { data, isLoading, error } = api.books.list.useQuery({
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
          <h1 className='font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
            Library Catalog
          </h1>
          <p className='text-muted-foreground mt-2 font-mono text-sm tracking-wider uppercase'>
            {totalCount === 0 ?
              'No entries'
            : `${totalCount} catalog entr${totalCount === 1 ? 'y' : 'ies'}`}
          </p>
        </div>

        <Button asChild className='w-full rounded-sm sm:w-auto'>
          <Link href='/books/new'>Add Book</Link>
        </Button>
      </div>

      {/* Search and Filter Controls */}
      <Card className='rounded-sm'>
        <CardContent className='pt-6'>
          <div className='grid gap-4 rounded-sm sm:grid-cols-2 lg:grid-cols-3'>
            <div className='sm:col-span-2'>
              <Input
                type='search'
                placeholder='Search books by title, author, or genre...'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className='w-full rounded-sm'
                aria-label='Search books'
              />
            </div>

            <Select
              value={
                // Convert boolean | undefined to string for Select component
                isRead === undefined ? 'all'
                : isRead ?
                  'read'
                : 'unread'
              }
              onValueChange={(value) => {
                // Convert string back to boolean | undefined
                setIsRead(value === 'all' ? undefined : value === 'read');
                setPage(1);
              }}
            >
              <SelectTrigger
                className='cursor-pointer rounded-sm'
                aria-label='Filter books by read status'
              >
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent className='rounded-sm'>
                <SelectItem value='all'>All Books</SelectItem>
                <SelectItem value='read'>Read</SelectItem>
                <SelectItem value='unread'>Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card role='alert' aria-live='assertive' className='rounded-sm'>
          <CardContent className='flex flex-col items-center justify-center py-8 md:py-12'>
            <p className='text-destructive mb-4 text-center font-semibold'>Failed to load books</p>
            <p className='text-muted-foreground mb-4 text-center text-sm'>
              {error.message || 'An unexpected error occurred'}
            </p>

            <Button
              variant='outline'
              onClick={() => window.location.reload()}
              className='w-full sm:w-auto'
              aria-label='Retry loading books'
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div
          className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          role='status'
          aria-live='polite'
          aria-label='Loading books'
        >
          {Array.from({ length: pageSize }).map((_, i) => (
            <div
              key={i}
              className='bg-card border-foreground/10 rounded-sm border-2 p-4'
              aria-hidden='true'
            >
              <div className='space-y-3'>
                <Skeleton className='h-5 w-3/4' />

                <div className='border-primary/20 border-l-2 pl-3'>
                  <Skeleton className='mb-1 h-3 w-16' />
                  <Skeleton className='h-4 w-2/3' />
                </div>

                <div className='space-y-2'>
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-3/4' />
                </div>

                <div className='border-foreground/10 border-t pt-3'>
                  <Skeleton className='h-3 w-20' />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && books.length === 0 && (
        <Card className='rounded-sm'>
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
      {!isLoading && !error && books.length > 0 && totalPages > 1 && (
        <div className='flex flex-col items-center justify-end gap-4 sm:flex-row'>
          <p className='text-muted-foreground font-bold'>
            Page {page} of {totalPages}
          </p>

          <div className='flex gap-2'>
            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='w-24 rounded-sm disabled:cursor-not-allowed disabled:opacity-50'
              aria-label={`Go to previous page, page ${page - 1}`}
            >
              Previous
            </Button>

            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='w-24 rounded-sm disabled:cursor-not-allowed disabled:opacity-50'
              aria-label={`Go to next page, page ${page + 1}`}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Books Catalog Grid */}
      {!isLoading && !error && books.length > 0 && (
        <>
          <div
            className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            role='list'
            aria-label='Library catalog entries'
          >
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className='group'
                role='listitem'
                aria-label={`${book.title} by ${book.author} - ${book.isRead ? 'Read' : 'Unread'}`}
              >
                <div className='relative h-full'>
                  {/* Library Catalog Card */}
                  <article className='bg-card text-card-foreground border-foreground/10 hover:border-primary/30 focus-within:ring-ring relative h-full rounded-sm border-2 p-4 shadow-sm transition-all group-hover:scale-[1.02] focus-within:ring-2 focus-within:ring-offset-2 hover:shadow-md'>
                    {/* Card Number / Call Number Style */}
                    <div className='text-muted-foreground/50 absolute top-2 right-2 font-mono text-[10px]'>
                      #{book.id.slice(0, 8).toUpperCase()}
                    </div>

                    {/* Title - Main Entry */}
                    <div className='mb-3 pr-12'>
                      <h3 className='group-hover:text-primary font-serif text-base leading-tight font-bold transition-colors sm:text-lg'>
                        {book.title}
                      </h3>
                    </div>

                    {/* Author - Secondary Entry */}
                    <div className='border-primary/20 mb-4 border-l-2 pl-3'>
                      <div className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
                        Author
                      </div>
                      <div className='font-serif text-sm leading-snug'>{book.author}</div>
                    </div>

                    {/* Publication Details */}
                    <div className='mb-3 space-y-1.5 text-xs'>
                      <div className='flex items-start gap-2'>
                        <span className='text-muted-foreground min-w-[60px] font-mono text-[10px] tracking-wider uppercase'>
                          Pub:
                        </span>
                        <span className='font-medium'>{book.publishYear}</span>
                      </div>

                      <div className='flex items-start gap-2'>
                        <span className='text-muted-foreground min-w-[60px] font-mono text-[10px] tracking-wider uppercase'>
                          Pages:
                        </span>
                        <span className='font-medium'>{book.numberOfPages}</span>
                      </div>

                      {book.genre && (
                        <div className='flex items-start gap-2'>
                          <span className='text-muted-foreground min-w-[60px] font-mono text-[10px] tracking-wider uppercase'>
                            Subject:
                          </span>
                          <span className='font-medium'>{book.genre}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Indicator */}
                    <div className='border-foreground/10 mt-4 border-t pt-3'>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
                          Status
                        </span>
                        <div className='flex items-center gap-1.5'>
                          <div
                            className={`h-2 w-2 rounded-full ${
                              book.isRead ? 'bg-green-600' : 'bg-amber-500'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold tracking-wider uppercase ${
                              book.isRead ?
                                'text-green-700 dark:text-green-500'
                              : 'text-amber-700 dark:text-amber-500'
                            }`}
                          >
                            {book.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Edge - Catalog Card Style */}
                    <div className='via-foreground/5 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent' />
                  </article>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
