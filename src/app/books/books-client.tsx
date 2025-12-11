'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronDownIcon } from 'lucide-react';
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
import { GenreFilterSelect } from '@/components/genre-filter-select';
import { cn } from '@/lib/utils';

type SortBy = 'title' | 'author' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function BooksClient() {
  const utils = api.useUtils();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL params for initial state
  const parseInitialState = useCallback(() => {
    const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
    const search = searchParams.get('search') ?? '';
    const genre = searchParams.get('genre')?.split(',').filter(Boolean) ?? [];
    const sortBy = (searchParams.get('sortBy') ?? 'createdAt') as SortBy;
    const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as SortOrder;
    const isReadParam = searchParams.get('isRead');
    const isRead =
      isReadParam === 'true' ? true
      : isReadParam === 'false' ? false
      : undefined;

    return { page, search, genre, sortBy, sortOrder, isRead };
  }, [searchParams]);

  const initial = parseInitialState();

  // State
  const [search, setSearch] = useState(initial.search);
  const [isRead, setIsRead] = useState<boolean | undefined>(initial.isRead);
  const [genre, setGenre] = useState<string[]>(initial.genre);
  const [sortBy, setSortBy] = useState<SortBy>(initial.sortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initial.sortOrder);
  const [page, setPage] = useState(initial.page);
  const [pageInput, setPageInput] = useState(String(initial.page));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageSize = 12;

  // Sync all filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set('search', search);
    if (isRead !== undefined) params.set('isRead', String(isRead));
    if (genre.length > 0) params.set('genre', genre.join(','));
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', String(page));

    const newUrl = params.toString() ? `/books?${params.toString()}` : '/books';
    router.replace(newUrl, { scroll: false });
  }, [search, isRead, genre, sortBy, sortOrder, page, router]);

  const { data, isLoading, error, isFetching } = api.books.list.useQuery(
    {
      search,
      isRead,
      genre,
      sortBy,
      sortOrder,
      page,
      pageSize,
    },
    {
      // Keep previous data visible during page transitions
      placeholderData: (previousData) => previousData,
    }
  );

  const books = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  // Sync pageInput when page changes (e.g., from Previous/Next buttons)
  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Filter helpers
  const hasActiveFilters = search || isRead !== undefined || genre.length > 0;
  const activeFilterCount = [
    search ? 1 : 0,
    isRead !== undefined ? 1 : 0,
    genre.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setSearch('');
    setIsRead(undefined);
    setGenre([]);
    setPage(1);
  };

  // Sort handlers
  const handleSortByChange = (value: SortBy) => {
    setSortBy(value);
    // Auto-flip to descending for date (newest first is expected)
    if (value === 'createdAt') {
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSortOrderChange = (value: SortOrder) => {
    setSortOrder(value);
    setPage(1);
  };

  // Context-aware sort order labels
  const getSortOrderLabel = (order: SortOrder) => {
    if (sortBy === 'createdAt') {
      return order === 'asc' ? 'Oldest First' : 'Newest First';
    }
    return order === 'asc' ? 'A → Z' : 'Z → A';
  };

  /**
   * Prefetch book details on hover for instant navigation.
   * The data will be cached and served immediately when the user clicks.
   */
  const prefetchBook = (bookId: string) => {
    void utils.books.getById.prefetch({ id: bookId });
  };

  /**
   * Prefetch next page of results on hover for instant pagination.
   */
  const prefetchNextPage = () => {
    if (page < totalPages) {
      void utils.books.list.prefetch({
        search,
        isRead,
        genre,
        sortBy,
        sortOrder,
        page: page + 1,
        pageSize,
      });
    }
  };

  // Filter controls component (reused for both mobile and desktop)
  const FilterControls = ({ className }: { className?: string }) => (
    <div className={cn('grid gap-4', className)}>
      {/* Search */}
      <div className='sm:col-span-2 lg:col-span-2'>
        <Input
          type='search'
          placeholder='Search books by title, author, or genre...'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className='placeholder:text-muted-foreground/70 w-full rounded-sm text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
          aria-label='Search books'
        />
      </div>

      {/* Genre Filter */}
      <GenreFilterSelect
        value={genre}
        onValueChange={(v) => {
          setGenre(v);
          setPage(1);
        }}
      />

      {/* Read Status */}
      <Select
        value={
          isRead === undefined ? 'all'
          : isRead ?
            'read'
          : 'unread'
        }
        onValueChange={(value) => {
          setIsRead(value === 'all' ? undefined : value === 'read');
          setPage(1);
        }}
      >
        <SelectTrigger
          className='w-full cursor-pointer rounded-sm'
          aria-label='Filter by read status'
        >
          <SelectValue placeholder='Filter by status' />
        </SelectTrigger>
        <SelectContent className='rounded-sm'>
          <SelectItem value='all'>All Books</SelectItem>
          <SelectItem value='read'>Read</SelectItem>
          <SelectItem value='unread'>Unread</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select value={sortBy} onValueChange={handleSortByChange}>
        <SelectTrigger className='w-full cursor-pointer rounded-sm' aria-label='Sort by'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className='rounded-sm'>
          <SelectItem value='title'>Sort by Title</SelectItem>
          <SelectItem value='author'>Sort by Author</SelectItem>
          <SelectItem value='createdAt'>Sort by Date Added</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order */}
      <Select value={sortOrder} onValueChange={handleSortOrderChange}>
        <SelectTrigger className='w-full cursor-pointer rounded-sm' aria-label='Sort order'>
          <SelectValue>{getSortOrderLabel(sortOrder)}</SelectValue>
        </SelectTrigger>
        <SelectContent className='rounded-sm'>
          <SelectItem value='asc'>{getSortOrderLabel('asc')}</SelectItem>
          <SelectItem value='desc'>{getSortOrderLabel('desc')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

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
          {/* Mobile: Collapsible filters */}
          <div className='sm:hidden'>
            <div className='mb-4'>
              <Input
                type='search'
                placeholder='Search books...'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className='placeholder:text-muted-foreground/70 w-full rounded-sm text-sm'
                aria-label='Search books'
              />
            </div>
            <Button
              variant='outline'
              onClick={() => setFiltersOpen(!filtersOpen)}
              className='w-full justify-between rounded-sm'
            >
              <span>
                Filters{' '}
                {hasActiveFilters && (
                  <span className='text-muted-foreground'>({activeFilterCount} active)</span>
                )}
              </span>
              <ChevronDownIcon
                className={cn('size-4 transition-transform', filtersOpen && 'rotate-180')}
              />
            </Button>

            {filtersOpen && (
              <div className='mt-4 grid gap-4'>
                <GenreFilterSelect
                  value={genre}
                  onValueChange={(v) => {
                    setGenre(v);
                    setPage(1);
                  }}
                />
                <Select
                  value={
                    isRead === undefined ? 'all'
                    : isRead ?
                      'read'
                    : 'unread'
                  }
                  onValueChange={(value) => {
                    setIsRead(value === 'all' ? undefined : value === 'read');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectItem value='all'>All Books</SelectItem>
                    <SelectItem value='read'>Read</SelectItem>
                    <SelectItem value='unread'>Unread</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={handleSortByChange}>
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectItem value='title'>Sort by Title</SelectItem>
                    <SelectItem value='author'>Sort by Author</SelectItem>
                    <SelectItem value='createdAt'>Sort by Date Added</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue>{getSortOrderLabel(sortOrder)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectItem value='asc'>{getSortOrderLabel('asc')}</SelectItem>
                    <SelectItem value='desc'>{getSortOrderLabel('desc')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Desktop: Always visible grid */}
          <FilterControls className='hidden sm:grid sm:grid-cols-2 lg:grid-cols-6' />
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

      {/* Loading State - show skeleton during initial load or page transitions */}
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
                <div className='bg-muted h-5 w-3/4 animate-pulse rounded' />
                <div className='border-primary/20 border-l-2 pl-3'>
                  <div className='bg-muted mb-1 h-3 w-16 animate-pulse rounded' />
                  <div className='bg-muted h-4 w-2/3 animate-pulse rounded' />
                </div>
                <div className='space-y-2'>
                  <div className='bg-muted h-3 w-full animate-pulse rounded' />
                  <div className='bg-muted h-3 w-full animate-pulse rounded' />
                  <div className='bg-muted h-3 w-3/4 animate-pulse rounded' />
                </div>
                <div className='border-foreground/10 border-t pt-3'>
                  <div className='bg-muted h-3 w-20 animate-pulse rounded' />
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
              {hasActiveFilters ?
                'No books found matching your filters.'
              : "You haven't added any books yet. Start building your library!"}
            </p>

            {!hasActiveFilters && (
              <Button asChild className='w-full sm:w-auto'>
                <Link href='/books/new'>Add Your First Book</Link>
              </Button>
            )}

            {hasActiveFilters && (
              <Button variant='outline' onClick={clearFilters} className='w-full sm:w-auto'>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination - only show when we have results and multiple pages */}
      {!error && books.length > 0 && totalPages > 1 && (
        <div
          className={`flex flex-col items-center gap-3 sm:flex-row sm:justify-end sm:gap-4 ${isFetching ? 'opacity-70' : ''}`}
        >
          {/* Page indicator / input */}
          {totalPages <= 5 ?
            <p className='text-muted-foreground text-sm font-bold sm:text-base'>
              Page {page} of {totalPages}
            </p>
          : <div className='flex items-center gap-2'>
              <span className='text-muted-foreground text-sm font-bold sm:text-base'>Page</span>
              <Input
                type='number'
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseInt(pageInput, 10);
                    if (!isNaN(value) && value >= 1 && value <= totalPages) {
                      setPage(value);
                    } else {
                      // Reset to current page if invalid
                      setPageInput(String(page));
                    }
                  }
                }}
                onBlur={() => {
                  // Reset to current page on blur (don't navigation)
                  setPageInput(String(page));
                }}
                className='h-9 w-14 [appearance:textfield] rounded-sm text-center text-sm sm:h-10 sm:w-16 sm:text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                aria-label='Page number'
              />
              <span className='text-muted-foreground text-sm font-bold sm:text-base'>
                of {totalPages}
              </span>
            </div>
          }

          {/* Navigation buttons */}
          <div className='flex w-full justify-center gap-1.5 sm:w-auto sm:gap-2'>
            {totalPages > 15 && (
              <Button
                variant='secondary'
                onClick={() => setPage(1)}
                disabled={page === 1}
                className='h-9 w-9 rounded-sm p-0 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10 sm:text-sm'
                aria-label='Go to first page'
              >
                ««
              </Button>
            )}

            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className='h-9 flex-1 rounded-sm text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-24 sm:flex-none sm:text-sm'
              aria-label={`Go to previous page, page ${page - 1}`}
            >
              Previous
            </Button>

            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className='h-9 flex-1 rounded-sm text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-24 sm:flex-none sm:text-sm'
              aria-label={`Go to next page, page ${page + 1}`}
              onMouseEnter={prefetchNextPage}
              onFocus={prefetchNextPage}
            >
              Next
            </Button>

            {totalPages > 15 && (
              <Button
                variant='secondary'
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className='h-9 w-9 rounded-sm p-0 text-xs disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10 sm:text-sm'
                aria-label='Go to last page'
              >
                »»
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Books Catalog Grid */}
      {!isLoading && !error && books.length > 0 && (
        <>
          <div
            className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isFetching ? 'opacity-60' : ''}`}
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
                onMouseEnter={() => prefetchBook(book.id)}
                onFocus={() => prefetchBook(book.id)}
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
