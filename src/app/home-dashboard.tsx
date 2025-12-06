'use client';

import Link from 'next/link';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface HomeDashboardProps {
  userName: string;
}

export function HomeDashboard({ userName }: HomeDashboardProps) {
  // Fetch books list to calculate statistics
  const { data, isLoading } = api.books.list.useQuery({
    page: 1,
    pageSize: 100,
  });

  // Calculate stats from the data
  const totalBooks = data?.totalCount ?? 0;
  const allBooksItems = data?.items ?? [];
  const readBooks = allBooksItems.filter((book) => book.isRead).length;
  const unreadBooks = totalBooks - readBooks;
  const totalPagesRead = allBooksItems
    .filter((book) => book.isRead)
    .reduce((sum, book) => sum + book.numberOfPages, 0);

  if (isLoading) {
    return (
      <div className='container mx-auto space-y-8 px-4 py-8 md:px-6'>
        {/* Welcome Section Skeleton */}
        <div className='space-y-2'>
          <Skeleton className='h-12 w-80' />
          <Skeleton className='h-6 w-64' />
        </div>

        {/* Statistics Cards Skeleton */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className='rounded-sm'>
              <CardHeader>
                <Skeleton className='h-4 w-24' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-9 w-16' />
                <Skeleton className='mt-2 h-4 w-32' />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Skeleton */}
        <div className='flex justify-center pt-4'>
          <Skeleton className='h-12 w-40' />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-8 px-4 py-8 md:px-6'>
      {/* Welcome Section */}
      <div className='space-y-2'>
        <h1 className='font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
          Welcome back, {userName}!
        </h1>
        <p className='text-muted-foreground text-lg sm:text-xl'>
          Here&apos;s an overview of your reading journey.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold'>{totalBooks}</div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {totalBooks === 1 ? 'book in your library' : 'books in your library'}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Books Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold text-green-700 dark:text-green-500'>
              {readBooks}
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {readBooks === 1 ? 'book completed' : 'books completed'}
              {totalBooks > 0 && (
                <span className='ml-1'>({Math.round((readBooks / totalBooks) * 100)}%)</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Books to Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold text-amber-700 dark:text-amber-500'>
              {unreadBooks}
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {unreadBooks === 1 ? 'book waiting' : 'books waiting'}
              {totalBooks > 0 && (
                <span className='ml-1'>({Math.round((unreadBooks / totalBooks) * 100)}%)</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Pages Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold'>{totalPagesRead.toLocaleString()}</div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {totalPagesRead === 1 ? 'page' : 'pages'} across all completed books
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className='flex justify-center pt-4'>
        <Button asChild size='lg' className='w-full px-7 py-4 text-lg sm:w-auto'>
          <Link href='/books'>View Library</Link>
        </Button>
      </div>
    </div>
  );
}
