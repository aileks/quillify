'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, notFound, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { BookForm } from '@/components/book-form';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BookInput } from '@/lib/book-validation';

interface BookDetailClientProps {
  bookId: string;
}

/**
 * Client component for displaying and editing book details.
 * Supports optimistic updates for read status and real-time data synchronization.
 *
 * Data is fetched client-side, leveraging React Query's cache for instant
 * navigation when prefetched from the library/dashboard views.
 */
export function BookDetailClient({ bookId }: BookDetailClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);

  const referrerRef = useRef<string | null>(null);
  useEffect(() => {
    const fromParam = searchParams.get('from');
    if (fromParam) {
      try {
        const decoded = decodeURIComponent(fromParam);
        const url = new URL(decoded, window.location.origin);
        // Validate: must be same-origin and /books path
        if (url.pathname === '/books') {
          referrerRef.current = url.pathname + url.search;
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }, [searchParams]);

  // Fetch book data - will be instant if prefetched on hover from library
  // Use retry: false for NOT_FOUND to avoid unnecessary retries
  const {
    data: book,
    isLoading,
    error,
  } = api.books.getById.useQuery(
    { id: bookId },
    {
      retry: (failureCount, error) => {
        // Don't retry on NOT_FOUND errors
        if (error?.data?.code === 'NOT_FOUND') return false;
        // Default retry behavior for other errors (3 retries)
        return failureCount < 3;
      },
    }
  );

  // Handle 404 - book not found (after loading completes)
  if (!isLoading && error?.data?.code === 'NOT_FOUND') {
    notFound();
  }

  const updateBook = api.books.update.useMutation({
    onSuccess: (book) => {
      toast.success(`"${book.title}" updated successfully`);
      void utils.books.getById.invalidate({ id: bookId });
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update book');
    },
  });

  /**
   * Optimistic update mutation for toggling read status.
   * Updates the UI immediately before the server responds, then rolls back on error.
   */
  const toggleRead = api.books.setRead.useMutation({
    onMutate: async (newData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await utils.books.getById.cancel({ id: bookId });

      // Snapshot the previous value for potential rollback
      const previousBook = utils.books.getById.getData({ id: bookId });

      // Optimistically update the cache
      utils.books.getById.setData({ id: bookId }, (old) =>
        old ? { ...old, isRead: newData.isRead } : old
      );

      return { previousBook };
    },
    onSuccess: (book) => {
      toast.success(
        book.isRead ? `"${book.title}" marked finished` : `"${book.title}" moved back to your TBR`
      );
    },
    onError: (err, newData, context) => {
      toast.error('Failed to update read status');
      // Rollback to previous value on error
      if (context?.previousBook) {
        utils.books.getById.setData({ id: bookId }, context.previousBook);
      }
    },
    onSettled: () => {
      // Always refetch to ensure server and client are in sync
      void utils.books.getById.invalidate({ id: bookId });
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
    },
  });

  const deleteBook = api.books.remove.useMutation({
    onSuccess: async () => {
      toast.success('Book removed from your reading list');
      await Promise.all([utils.books.list.invalidate(), utils.books.stats.invalidate()]);
      router.push(referrerRef.current ?? '/books');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete book');
    },
  });

  function onSubmit(data: BookInput) {
    updateBook.mutate({
      id: bookId,
      ...data,
    });
  }

  if (isLoading || !book) {
    return (
      <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-40' />
        </div>
        <div className='bg-card border-foreground/10 rounded-sm border-2 p-6 shadow-sm md:p-8'>
          <div className='space-y-6'>
            <Skeleton className='h-12 w-3/4' />
            <div className='border-primary/20 border-l-2 pl-3'>
              <Skeleton className='mb-2 h-4 w-16' />
              <Skeleton className='h-6 w-48' />
            </div>
            <div className='space-y-3'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='border-foreground/10 border-t pt-4'>
              <Skeleton className='h-10 w-32' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          onClick={() => router.back()}
          className='w-full sm:w-auto'
          aria-label='Return to books list'
        >
          <ArrowLeft data-icon='inline-start' />
          Back to Reading List
        </Button>
      </div>

      {isEditing ?
        <div className='flex flex-col gap-6'>
          <header className='flex flex-col gap-2'>
            <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Edit book</h1>
            <p className='text-muted-foreground'>Update the details for “{book.title}”.</p>
          </header>
          <BookForm
            defaultValues={{
              title: book.title,
              author: book.author,
              numberOfPages: String(book.numberOfPages),
              publishYear: String(book.publishYear),
              genre: book.genre || '',
            }}
            title='Book details'
            actionLabel='Save Changes'
            pendingLabel='Saving...'
            isPending={updateBook.isPending}
            onSubmit={onSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      : <article className='bg-card text-card-foreground border-foreground/10 relative rounded-sm border-2 p-6 shadow-sm md:p-8'>
          <h1 className='font-serif text-3xl leading-tight font-bold sm:text-4xl md:text-5xl'>
            {book.title}
          </h1>

          {/* Author - Secondary Entry */}
          <div className='border-primary/20 mt-6 mb-8 border-l-2 pl-3'>
            <div className='text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase'>
              Author
            </div>
            <div className='font-serif text-xl leading-snug'>{book.author}</div>
          </div>

          {/* Publication Details */}
          <div className='mb-6 space-y-3 text-sm'>
            <div className='flex items-start gap-3'>
              <span className='text-muted-foreground min-w-[80px] font-mono text-xs tracking-wider uppercase'>
                Publication Year
              </span>
              <span className='text-base font-medium'>{book.publishYear}</span>
            </div>

            <div className='flex items-start gap-3'>
              <span className='text-muted-foreground min-w-[80px] font-mono text-xs tracking-wider uppercase'>
                Pages:
              </span>
              <span className='text-base font-medium'>{book.numberOfPages}</span>
            </div>

            {book.genre && (
              <div className='flex items-start gap-3'>
                <span className='text-muted-foreground min-w-[80px] font-mono text-xs tracking-wider uppercase'>
                  Genre
                </span>
                <span className='text-base font-medium'>{book.genre}</span>
              </div>
            )}

            {book.createdAt && (
              <div className='flex items-start gap-3'>
                <span className='text-muted-foreground min-w-[80px] font-mono text-xs tracking-wider uppercase'>
                  Added:
                </span>
                <span className='text-base font-medium'>
                  {new Date(book.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          <div className='border-foreground/10 mb-6 border-t pt-4'>
            <div className='flex items-center gap-3'>
              <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Status
              </span>
              <Badge variant={book.isRead ? 'default' : 'secondary'}>
                {book.isRead ? 'Finished' : 'To Read'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='border-foreground/10 flex flex-col gap-3 border-t pt-4 sm:flex-row'>
            <Button
              variant='outline'
              onClick={() => toggleRead.mutate({ id: book.id, isRead: !book.isRead })}
              disabled={toggleRead.isPending}
              className='flex-1 sm:flex-none'
            >
              {toggleRead.isPending ?
                'Updating...'
              : book.isRead ?
                'Move Back to TBR'
              : 'Mark Finished'}
            </Button>

            <Button
              variant='outline'
              onClick={() => setIsEditing(true)}
              className='flex-1 sm:flex-none'
              aria-label={`Edit ${book.title}`}
            >
              Edit Book
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  className='flex-1 sm:flex-none'
                  aria-label={`Delete ${book.title}`}
                >
                  Delete
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this book?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete &quot;
                    {book.title}&quot; from your reading list.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={() => deleteBook.mutate({ id: book.id })}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className='via-foreground/5 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent' />
        </article>
      }
    </div>
  );
}
