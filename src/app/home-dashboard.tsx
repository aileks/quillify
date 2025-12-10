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
  const utils = api.useUtils();
  const { data: stats, isLoading } = api.books.stats.useQuery();

  /**
   * Prefetch book details on hover for instant navigation.
   */
  const prefetchBook = (bookId: string) => {
    void utils.books.getById.prefetch({ id: bookId });
  };

  if (isLoading || !stats) {
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

        {/* Insights Section Skeleton */}
        <div className='grid gap-4 md:grid-cols-2'>
          <Card className='rounded-sm'>
            <CardHeader>
              <Skeleton className='h-5 w-32' />
            </CardHeader>
            <CardContent className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-4 w-full' />
              ))}
            </CardContent>
          </Card>
          <Card className='rounded-sm'>
            <CardHeader>
              <Skeleton className='h-5 w-32' />
            </CardHeader>
            <CardContent className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* CTA Skeleton */}
        <div className='flex justify-center pt-4'>
          <Skeleton className='h-12 w-40' />
        </div>
      </div>
    );
  }

  const {
    totalBooks,
    readBooks,
    unreadBooks,
    totalPagesRead,
    averagePages,
    oldestPublishYear,
    newestPublishYear,
    topGenres,
    recentlyAdded,
  } = stats;

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

      {/* Insights Section - 2 Column Layout */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Library Insights Card */}
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='font-serif text-xl font-bold'>Library Insights</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {totalBooks === 0 ?
              <p className='text-muted-foreground text-sm'>
                Add some books to see insights about your collection.
              </p>
            : <>
                <div className='flex items-start gap-3'>
                  <span className='text-muted-foreground min-w-[100px] font-mono text-xs tracking-wider uppercase'>
                    Avg. Length
                  </span>
                  <span className='text-sm font-medium'>
                    {averagePages.toLocaleString()} pages per book
                  </span>
                </div>

                {oldestPublishYear && newestPublishYear && (
                  <div className='flex items-start gap-3'>
                    <span className='text-muted-foreground min-w-[100px] font-mono text-xs tracking-wider uppercase'>
                      Pub. Range
                    </span>
                    <span className='text-sm font-medium'>
                      {oldestPublishYear === newestPublishYear ?
                        oldestPublishYear
                      : `${oldestPublishYear} – ${newestPublishYear}`}
                    </span>
                  </div>
                )}

                {topGenres.length > 0 && (
                  <div className='flex items-start gap-3'>
                    <span className='text-muted-foreground min-w-[100px] font-mono text-xs tracking-wider uppercase'>
                      Top Genres
                    </span>
                    <div className='space-y-1'>
                      {topGenres.map((g, index) => (
                        <div key={g.genre} className='text-sm'>
                          <span className='text-muted-foreground mr-2'>{index + 1}.</span>
                          <span className='font-medium'>{g.genre}</span>
                          <span className='text-muted-foreground ml-1'>
                            ({g.count} {g.count === 1 ? 'book' : 'books'})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            }
          </CardContent>
        </Card>

        {/* Recently Added Card */}
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='font-serif text-xl font-bold'>Recently Added</CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyAdded.length === 0 ?
              <p className='text-muted-foreground text-sm'>
                No books in your library yet. Start by adding your first book!
              </p>
            : <div className='space-y-3'>
                {recentlyAdded.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className='hover:bg-muted/50 block rounded-sm p-2 transition-colors'
                    onMouseEnter={() => prefetchBook(book.id)}
                    onFocus={() => prefetchBook(book.id)}
                  >
                    <div className='font-serif leading-tight font-medium'>{book.title}</div>
                    <div className='text-muted-foreground text-sm'>by {book.author}</div>
                  </Link>
                ))}
              </div>
            }
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
