'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GenreFilterSelect } from '@/components/genre-filter-select';
import { parseBookQueryParams, type BookSortBy, type BookSortOrder } from '@/lib/book-query';
import { cn } from '@/lib/utils';
import type { Book } from '@/types';

interface BookCatalogCardProps {
  book: Book;
  isSelected?: boolean;
  selectionMode?: boolean;
}

function BookCatalogCard({
  book,
  isSelected = false,
  selectionMode = false,
}: BookCatalogCardProps) {
  return (
    <div className='relative h-full'>
      <article
        className={cn(
          'bg-card text-card-foreground border-foreground/10 hover:border-primary/30 focus-within:ring-ring relative h-full rounded-sm border-2 p-4 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-offset-2',
          isSelected && 'border-primary ring-primary/20 ring-2'
        )}
      >
        <div className='text-muted-foreground/50 absolute top-2 right-2 font-mono text-[10px]'>
          #{book.id.slice(0, 8).toUpperCase()}
        </div>

        <div className={cn('mb-3 pr-12', selectionMode && 'pl-7')}>
          <h3 className='group-hover:text-primary font-serif text-base leading-tight font-bold transition-colors sm:text-lg'>
            {book.title}
          </h3>
        </div>

        <div className='border-primary/20 mb-4 border-l-2 pl-3'>
          <div className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
            Author
          </div>
          <div className='font-serif text-sm leading-snug'>{book.author}</div>
        </div>

        <div className='mb-3 flex flex-col gap-1.5 text-xs'>
          <div className='flex items-start gap-2'>
            <span className='text-muted-foreground min-w-[72px] font-mono text-xs tracking-wider uppercase'>
              Year
            </span>
            <span className='font-medium'>{book.publishYear}</span>
          </div>

          <div className='flex items-start gap-2'>
            <span className='text-muted-foreground min-w-[72px] font-mono text-xs tracking-wider uppercase'>
              Pages
            </span>
            <span className='font-medium'>{book.numberOfPages}</span>
          </div>

          {book.genre && (
            <div className='flex items-start gap-2'>
              <span className='text-muted-foreground min-w-[72px] font-mono text-xs tracking-wider uppercase'>
                Genre
              </span>
              <span className='font-medium'>{book.genre}</span>
            </div>
          )}
        </div>

        <div className='border-foreground/10 mt-4 border-t pt-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
              Status
            </span>
            <Badge variant={book.isRead ? 'default' : 'secondary'}>
              {book.isRead ? 'Finished' : 'To Read'}
            </Badge>
          </div>
        </div>

        <div className='via-foreground/5 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent' />
      </article>
    </div>
  );
}

interface BooksClientProps {
  subtitle: string;
}

export function BooksClient({ subtitle }: BooksClientProps) {
  const utils = api.useUtils();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentFromUrl =
    searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

  const initial = parseBookQueryParams(searchParams);

  // State
  const [search, setSearch] = useState(initial.search);
  const [querySearch, setQuerySearch] = useState(initial.search);
  const [isRead, setIsRead] = useState<boolean | undefined>(initial.isRead);
  const [genre, setGenre] = useState<string[]>(initial.genre);
  const [sortBy, setSortBy] = useState<BookSortBy>(initial.sortBy);
  const [sortOrder, setSortOrder] = useState<BookSortOrder>(initial.sortOrder);
  const [page, setPage] = useState(initial.page);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(() => new Set());
  const pageSize = 12;

  const resetPage = useCallback(() => {
    setPage(1);
    setSelectedBookIds(new Set());
  }, []);

  const goToPage = useCallback((nextPage: number) => {
    setPage(nextPage);
    setSelectedBookIds(new Set());
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuerySearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  // Sync all filters to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (querySearch) params.set('search', querySearch);
    if (isRead !== undefined) params.set('isRead', String(isRead));
    if (genre.length > 0) params.set('genre', genre.join(','));
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (page > 1) params.set('page', String(page));

    const newUrl = params.toString() ? `/books?${params.toString()}` : '/books';
    router.replace(newUrl, { scroll: false });
  }, [querySearch, isRead, genre, sortBy, sortOrder, page, router]);

  const { data, isLoading, error, isFetching } = api.books.list.useQuery(
    {
      search: querySearch,
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
  const currentPage = data?.page ?? page;

  const selectedBooks = books.filter((book) => selectedBookIds.has(book.id));
  const allBooksSelected = books.length > 0 && selectedBooks.length === books.length;
  const someBooksSelected = selectedBooks.length > 0 && !allBooksSelected;

  const toggleBookSelection = useCallback((bookId: string) => {
    setSelectedBookIds((current) => {
      const next = new Set(current);

      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }

      return next;
    });
  }, []);

  const cancelSelection = () => {
    setIsDeleteDialogOpen(false);
    setSelectedBookIds(new Set());
    setIsSelectionMode(false);
  };

  const deleteBooks = api.books.removeMany.useMutation({
    onSuccess: async ({ ids }) => {
      toast.success(`${ids.length} book${ids.length === 1 ? '' : 's'} deleted`);
      const remainingPages = Math.max(1, Math.ceil((totalCount - ids.length) / pageSize));
      setPage((current) => Math.min(current, remainingPages));
      cancelSelection();
      await Promise.all([utils.books.list.invalidate(), utils.books.stats.invalidate()]);
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to delete books');
    },
  });

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
    resetPage();
  };

  // Sort handlers
  const handleSortByChange = (value: BookSortBy) => {
    setSortBy(value);
    // Set sensible defaults: A→Z for text fields, newest-first for dates
    if (value === 'createdAt') {
      setSortOrder('desc');
    } else {
      setSortOrder('asc');
    }
    resetPage();
  };

  const handleSortOrderChange = (value: BookSortOrder) => {
    setSortOrder(value);
    resetPage();
  };

  // Context-aware sort order labels
  const getSortOrderLabel = (order: BookSortOrder) => {
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
    if (currentPage < totalPages) {
      void utils.books.list.prefetch({
        search: querySearch,
        isRead,
        genre,
        sortBy,
        sortOrder,
        page: currentPage + 1,
        pageSize,
      });
    }
  };

  return (
    <div className='container mx-auto space-y-6 px-4 py-6 md:px-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <h1 className='font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
            My Library
          </h1>
          <p className='text-muted-foreground mt-2 text-sm'>{subtitle}</p>
        </div>

        <div className='flex w-full gap-2 sm:w-auto'>
          {(totalCount > 0 || isSelectionMode) && (
            <Button
              variant='outline'
              onClick={isSelectionMode ? cancelSelection : () => setIsSelectionMode(true)}
              className='flex-1 rounded-sm sm:flex-none'
            >
              {isSelectionMode ? 'Cancel selection' : 'Select'}
            </Button>
          )}

          <Button asChild className='flex-1 rounded-sm sm:flex-none'>
            <Link href='/books/new'>Add to List</Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className='rounded-sm'>
        <CardContent>
          {/* Mobile: Collapsible filters */}
          <div className='sm:hidden'>
            <div className='mb-4'>
              <Input
                type='search'
                placeholder='Search your library'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
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
                    resetPage();
                  }}
                />
                <Select
                  value={
                    isRead === undefined ? 'all'
                    : isRead ?
                      'finished'
                    : 'to-read'
                  }
                  onValueChange={(value) => {
                    setIsRead(value === 'all' ? undefined : value === 'finished');
                    resetPage();
                  }}
                >
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectGroup>
                      <SelectItem value='all'>All Books</SelectItem>
                      <SelectItem value='finished'>Finished</SelectItem>
                      <SelectItem value='to-read'>To Read</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={handleSortByChange}>
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectGroup>
                      <SelectItem value='title'>Sort by Title</SelectItem>
                      <SelectItem value='author'>Sort by Author</SelectItem>
                      <SelectItem value='createdAt'>Sort by Date Added</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                  <SelectTrigger className='cursor-pointer rounded-sm'>
                    <SelectValue>{getSortOrderLabel(sortOrder)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className='rounded-sm'>
                    <SelectGroup>
                      <SelectItem value='asc'>{getSortOrderLabel('asc')}</SelectItem>
                      <SelectItem value='desc'>{getSortOrderLabel('desc')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Desktop: Always visible grid */}
          <div className='hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-6'>
            {/* Search */}
            <div className='flex flex-col gap-2 sm:col-span-2 lg:col-span-2'>
              <Label htmlFor='reading-list-search'>Search</Label>
              <Input
                id='reading-list-search'
                type='search'
                placeholder='Search by title, author, or genre'
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className='placeholder:text-muted-foreground/70 w-full rounded-sm text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                aria-label='Search books'
              />
            </div>

            {/* Genre Filter */}
            <div className='flex flex-col gap-2'>
              <Label>Genre</Label>
              <GenreFilterSelect
                value={genre}
                onValueChange={(v) => {
                  setGenre(v);
                  resetPage();
                }}
              />
            </div>

            {/* Read Status */}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='reading-status-filter'>Status</Label>
              <Select
                value={
                  isRead === undefined ? 'all'
                  : isRead ?
                    'finished'
                  : 'to-read'
                }
                onValueChange={(value) => {
                  setIsRead(value === 'all' ? undefined : value === 'finished');
                  resetPage();
                }}
              >
                <SelectTrigger
                  id='reading-status-filter'
                  className='w-full cursor-pointer rounded-sm'
                >
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent className='rounded-sm'>
                  <SelectGroup>
                    <SelectItem value='all'>All Books</SelectItem>
                    <SelectItem value='finished'>Finished</SelectItem>
                    <SelectItem value='to-read'>To Read</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='reading-list-sort'>Sort by</Label>
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger id='reading-list-sort' className='w-full cursor-pointer rounded-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='rounded-sm'>
                  <SelectGroup>
                    <SelectItem value='title'>Title</SelectItem>
                    <SelectItem value='author'>Author</SelectItem>
                    <SelectItem value='createdAt'>Date Added</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='reading-list-sort-order'>Order</Label>
              <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger
                  id='reading-list-sort-order'
                  className='w-full cursor-pointer rounded-sm'
                >
                  <SelectValue>{getSortOrderLabel(sortOrder)}</SelectValue>
                </SelectTrigger>
                <SelectContent className='rounded-sm'>
                  <SelectGroup>
                    <SelectItem value='asc'>{getSortOrderLabel('asc')}</SelectItem>
                    <SelectItem value='desc'>{getSortOrderLabel('desc')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isSelectionMode && !error && books.length > 0 && (
        <div
          className='bg-card border-foreground/10 flex flex-col gap-4 rounded-sm border-2 p-4 sm:flex-row sm:items-center sm:justify-between'
          role='toolbar'
          aria-label='Book selection actions'
        >
          <div className='flex items-center gap-3'>
            <Checkbox
              id='select-all-books'
              checked={
                allBooksSelected ? true
                : someBooksSelected ?
                  'indeterminate'
                : false
              }
              onCheckedChange={(checked) => {
                setSelectedBookIds(
                  checked === true ? new Set(books.map(({ id }) => id)) : new Set()
                );
              }}
              disabled={isFetching || deleteBooks.isPending}
            />
            <Label htmlFor='select-all-books' className='cursor-pointer'>
              Select all on this page
            </Label>
            <span className='text-muted-foreground text-sm'>{selectedBooks.length} selected</span>
          </div>

          <div className='flex'>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  disabled={selectedBooks.length === 0 || deleteBooks.isPending}
                  className='flex-1 sm:flex-none'
                >
                  Delete
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedBooks.length} {selectedBooks.length === 1 ? 'book' : 'books'}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The selected books will be permanently removed
                    from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <ul
                  className='bg-muted flex max-h-60 flex-col gap-1 overflow-y-auto rounded-sm p-3 text-sm'
                  aria-label='Books selected for deletion'
                >
                  {selectedBooks.map((book) => (
                    <li key={book.id}>{book.title}</li>
                  ))}
                </ul>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant='destructive'
                    disabled={selectedBooks.length === 0 || deleteBooks.isPending}
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      deleteBooks.mutate({
                        ids: selectedBooks.map(({ id }) => id),
                      });
                    }}
                  >
                    Delete {selectedBooks.length} {selectedBooks.length === 1 ? 'book' : 'books'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

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
                <Skeleton className='h-5 w-3/4' />
                <div className='border-primary/20 border-l-2 pl-3'>
                  <Skeleton className='mb-1 h-3 w-16' />
                  <Skeleton className='h-4 w-2/3' />
                </div>
                <div className='flex flex-col gap-2'>
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
              {hasActiveFilters ?
                'No books found matching your filters.'
              : 'Your library is empty. Add the first book on your TBR.'}
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

      {/* Books Catalog Grid */}
      {!isLoading && !error && books.length > 0 && (
        <div
          className={cn(
            'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
            isFetching && 'opacity-60'
          )}
          role='list'
          aria-label='Library'
        >
          {books.map((book) => (
            <div key={book.id} role='listitem'>
              {isSelectionMode ?
                <label
                  htmlFor={`select-book-${book.id}`}
                  className={cn(
                    'group relative block h-full',
                    isFetching || deleteBooks.isPending ? 'cursor-not-allowed' : 'cursor-pointer'
                  )}
                >
                  <BookCatalogCard
                    book={book}
                    selectionMode
                    isSelected={selectedBookIds.has(book.id)}
                  />
                  <Checkbox
                    id={`select-book-${book.id}`}
                    checked={selectedBookIds.has(book.id)}
                    onCheckedChange={() => toggleBookSelection(book.id)}
                    disabled={isFetching || deleteBooks.isPending}
                    className='absolute top-4 left-4'
                    aria-label={`Select ${book.title}`}
                  />
                </label>
              : <Link
                  href={`/books/${book.id}?from=${encodeURIComponent(currentFromUrl)}`}
                  className='group block h-full'
                  aria-label={`${book.title} by ${book.author} - ${
                    book.isRead ? 'Finished' : 'To Read'
                  }`}
                  onMouseEnter={() => prefetchBook(book.id)}
                  onFocus={() => prefetchBook(book.id)}
                >
                  <BookCatalogCard book={book} />
                </Link>
              }
            </div>
          ))}
        </div>
      )}

      {!error && books.length > 0 && totalPages > 1 && (
        <nav
          className={cn(
            'flex flex-col items-center gap-3 sm:flex-row sm:justify-end sm:gap-4',
            isFetching && 'opacity-70'
          )}
          aria-label='Library pagination'
        >
          {totalPages <= 5 ?
            <p className='text-muted-foreground text-sm font-bold sm:text-base'>
              Page {currentPage} of {totalPages}
            </p>
          : <div className='flex items-center gap-2'>
              <Label htmlFor='reading-list-page'>Page</Label>
              <Input
                id='reading-list-page'
                type='number'
                min={1}
                max={totalPages}
                key={currentPage}
                defaultValue={currentPage}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    const requestedPage = Number.parseInt(event.currentTarget.value, 10);
                    if (
                      Number.isInteger(requestedPage) &&
                      requestedPage >= 1 &&
                      requestedPage <= totalPages
                    ) {
                      goToPage(requestedPage);
                    } else {
                      event.currentTarget.value = String(currentPage);
                    }
                  }
                }}
                onBlur={(event) => {
                  event.currentTarget.value = String(currentPage);
                }}
                className='h-8 w-12 [appearance:textfield] rounded-sm text-center text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
              />
              <span className='text-muted-foreground text-sm font-bold sm:text-base'>
                of {totalPages}
              </span>
            </div>
          }

          <div className='flex w-full justify-center gap-2 sm:w-auto'>
            {totalPages > 15 && (
              <Button
                variant='secondary'
                size='icon'
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                aria-label='Go to first page'
              >
                <ChevronsLeft />
              </Button>
            )}

            <Button
              variant='secondary'
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='flex-1 sm:flex-none'
              aria-label={`Go to previous page, page ${currentPage - 1}`}
            >
              <ChevronLeft data-icon='inline-start' />
              Previous
            </Button>

            <Button
              variant='secondary'
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className='flex-1 sm:flex-none'
              aria-label={`Go to next page, page ${currentPage + 1}`}
              onMouseEnter={prefetchNextPage}
              onFocus={prefetchNextPage}
            >
              Next
              <ChevronRight data-icon='inline-end' />
            </Button>

            {totalPages > 15 && (
              <Button
                variant='secondary'
                size='icon'
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label='Go to last page'
              >
                <ChevronsRight />
              </Button>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
