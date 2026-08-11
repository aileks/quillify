'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { READING_STATUS_LABELS } from '@/lib/reading-lifecycle';

interface HomeDashboardProps {
  initialUserName: string;
  subtitle: string;
}

export function HomeDashboard({ initialUserName, subtitle }: HomeDashboardProps) {
  const { data: session } = useSession();
  const { data: stats, isLoading } = api.books.stats.useQuery();
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || initialUserName;

  if (isLoading || !stats) {
    return (
      <div className='container mx-auto space-y-6 px-4 py-6 sm:space-y-8 sm:py-8 md:px-6'>
        {/* Welcome Section Skeleton */}
        <div className='space-y-2'>
          <Skeleton className='h-9 w-64 sm:h-10 sm:w-80 md:h-12' />
          <Skeleton className='h-5 w-48 sm:h-6 sm:w-64' />
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
        <div className='flex justify-center pt-2 sm:pt-4'>
          <Skeleton className='h-12 w-full sm:w-40' />
        </div>
      </div>
    );
  }

  const {
    totalBooks,
    finishedReads,
    statusCounts,
    totalPagesRead,
    averagePages,
    oldestPublishYear,
    newestPublishYear,
    topGenres,
    recentlyAdded,
  } = stats;

  return (
    <div className='container mx-auto space-y-6 px-4 py-6 sm:space-y-8 sm:py-8 md:px-6'>
      {/* Welcome Section */}
      <div className='space-y-2'>
        <h1 className='font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
          Welcome back, {userName}!
        </h1>
        <p className='text-muted-foreground text-base sm:text-lg md:text-xl'>{subtitle}</p>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold'>{totalBooks}</div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {totalBooks === 1 ? 'book on your list' : 'books on your list'}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Finished
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-primary font-serif text-3xl font-bold'>{finishedReads}</div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {finishedReads === 1 ? 'completed reading' : 'completed readings'}
            </p>
          </CardContent>
        </Card>

        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Reading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='font-serif text-3xl font-bold'>{statusCounts.reading}</div>
            <p className='text-muted-foreground mt-1 text-sm'>
              {statusCounts.reading === 1 ? 'book in progress' : 'books in progress'}
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
            <CardTitle className='font-serif text-xl font-bold'>Reading Insights</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 font-serif'>
            {totalBooks === 0 ?
              <p className='text-muted-foreground text-sm'>
                Add books to see insights about your library.
              </p>
            : <>
                <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3'>
                  <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase sm:min-w-[100px]'>
                    Avg. Length
                  </span>
                  <span className='text-sm font-medium'>
                    {averagePages.toLocaleString()} pages per book
                  </span>
                </div>

                {oldestPublishYear && newestPublishYear && (
                  <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3'>
                    <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase sm:min-w-[100px]'>
                      Pub. Range
                    </span>
                    <span className='text-sm font-medium'>
                      {oldestPublishYear === newestPublishYear ?
                        oldestPublishYear
                      : `${oldestPublishYear} - ${newestPublishYear}`}
                    </span>
                  </div>
                )}

                {topGenres.length > 0 && (
                  <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3'>
                    <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase sm:min-w-[100px]'>
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

                <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3'>
                  <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase sm:min-w-[100px]'>
                    Status
                  </span>
                  <div className='flex flex-wrap gap-x-3 gap-y-1 text-sm'>
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <span key={status}>
                        {READING_STATUS_LABELS[status as keyof typeof READING_STATUS_LABELS]}{' '}
                        <span className='text-muted-foreground'>({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
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
                Your library is empty. Add the first book on your TBR.
              </p>
            : <div className='space-y-3'>
                {recentlyAdded.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    prefetch={false}
                    className='hover:bg-muted/50 block rounded-sm p-2 transition-colors'
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
      <div className='flex justify-center pt-2 sm:pt-4'>
        <Button asChild size='lg' className='w-full px-7 py-4 text-base sm:w-auto sm:text-lg'>
          <Link href='/books'>View Library</Link>
        </Button>
      </div>
    </div>
  );
}
