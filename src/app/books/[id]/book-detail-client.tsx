'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, notFound, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { BookCover } from '@/components/book-cover';
import { BookForm } from '@/components/book-form';
import { ReadingPeriodDialog } from '@/components/reading-period-dialog';
import { ReadingStatusBadge } from '@/components/reading-status-badge';
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
import type { BookCreateInput } from '@/lib/book-validation';
import {
  OWNERSHIP_TYPE_LABELS,
  READING_FORMAT_LABELS,
  READING_STATUSES,
  READING_STATUS_LABELS,
  isTerminalReadingStatus,
  type ReadingPeriodFields,
} from '@/lib/reading-lifecycle';
import type { ReadingPeriod } from '@/types';

interface BookDetailClientProps {
  bookId: string;
  editSaying: string;
}

function getTransitionDefaults(period: ReadingPeriod): ReadingPeriodFields {
  return {
    status: period.status,
    format: period.format,
    startedOn: period.startedOn,
    endedOn: period.endedOn,
  };
}

function formatReadingDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Client component for displaying and editing book details.
 * Uses the hydrated React Query cache and replaces detail data with mutation responses.
 */
export function BookDetailClient({ bookId, editSaying }: BookDetailClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const searchParams = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReadingPeriod | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const { data: book, isLoading, error } = api.books.getById.useQuery({ id: bookId });

  // Handle 404 - book not found (after loading completes)
  if (!isLoading && error?.data?.code === 'NOT_FOUND') {
    notFound();
  }

  const updateBook = api.books.update.useMutation({
    onSuccess: (updatedBook) => {
      toast.success(`"${updatedBook.title}" updated successfully`);
      utils.books.getById.setData({ id: bookId }, updatedBook);
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update book');
    },
  });

  const transitionStatus = api.books.transitionStatus.useMutation({
    onSuccess: (updatedBook) => {
      toast.success(
        `Status changed to ${READING_STATUS_LABELS[updatedBook.currentReadingPeriod.status]}`
      );
      utils.books.getById.setData({ id: bookId }, updatedBook);
      setIsTransitioning(false);
      setEditingPeriod(null);
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to update reading status');
    },
  });

  const updateReadingPeriod = api.books.updateReadingPeriod.useMutation({
    onSuccess: (updatedBook) => {
      toast.success('Reading history updated');
      utils.books.getById.setData({ id: bookId }, updatedBook);
      setEditingPeriod(null);
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to update reading history');
    },
  });

  const deleteBook = api.books.remove.useMutation({
    onSuccess: async () => {
      toast.success('Book removed from your library');
      await Promise.all([utils.books.list.invalidate(), utils.books.stats.invalidate()]);
      router.push(referrerRef.current ?? '/books');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete book');
    },
  });

  function onSubmit(data: BookCreateInput) {
    updateBook.mutate({
      id: bookId,
      title: data.title,
      author: data.author,
      numberOfPages: data.numberOfPages,
      genre: data.genre,
      publishYear: data.publishYear,
      coverSource: data.coverSource,
      coverSourceId: data.coverSourceId,
      isbn10: data.isbn10,
      isbn13: data.isbn13,
      openLibraryWorkId: data.openLibraryWorkId,
      openLibraryEditionId: data.openLibraryEditionId,
      ownershipType: data.ownershipType,
      readingDetails: data.readingDetails,
    });
  }

  if (isLoading || !book) {
    return (
      <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-40' />
        </div>
        <div className='bg-card border-foreground/10 grid gap-6 rounded-sm border-2 p-6 shadow-sm md:grid-cols-[minmax(160px,220px)_1fr] md:p-8'>
          <Skeleton className='aspect-[2/3] w-40 justify-self-center rounded-sm md:w-full' />
          <div className='flex flex-col gap-6'>
            <Skeleton className='h-12 w-3/4' />
            <div className='border-primary/20 border-l-2 pl-3'>
              <Skeleton className='mb-2 h-4 w-16' />
              <Skeleton className='h-6 w-48' />
            </div>
            <div className='flex flex-col gap-3'>
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
          Back to Library
        </Button>
      </div>

      {isEditing ?
        <div>
          <BookForm
            defaultValues={{
              title: book.title,
              author: book.author,
              numberOfPages: String(book.numberOfPages),
              publishYear: String(book.publishYear),
              genre: book.genre || '',
              coverSource: book.coverSource === 'open_library' ? 'open_library' : null,
              coverSourceId: book.coverSourceId,
              isbn: book.isbn13 ?? book.isbn10 ?? '',
              catalogIsbns: [book.isbn13, book.isbn10].filter(
                (isbn): isbn is string => isbn !== null
              ),
              openLibraryWorkId: book.openLibraryWorkId,
              openLibraryEditionId: book.openLibraryEditionId,
              ownershipType: book.ownershipType,
              includeReadingDetails: true,
              readingStatus: book.currentReadingPeriod.status,
              readingFormat: book.currentReadingPeriod.format ?? '',
              startedOn: book.currentReadingPeriod.startedOn ?? '',
              endedOn: book.currentReadingPeriod.endedOn ?? '',
            }}
            title={`Editing ${book.title}`}
            saying={editSaying}
            actionLabel='Save Changes'
            pendingLabel='Saving...'
            isPending={updateBook.isPending}
            readingDetailsMode='required'
            onSubmit={onSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      : <article className='bg-card text-card-foreground border-foreground/10 relative grid gap-6 rounded-sm border-2 p-6 shadow-sm md:grid-cols-[minmax(160px,220px)_1fr] md:p-8'>
          <BookCover
            coverSourceId={book.coverSource === 'open_library' ? book.coverSourceId : null}
            title={book.title}
            author={book.author}
            size='L'
            sizes='(max-width: 768px) 160px, 220px'
            loading='eager'
            className='w-40 justify-self-center md:w-full'
          />

          <div className='min-w-0'>
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
            <dl className='mb-6 grid grid-cols-[82px_minmax(0,1fr)] items-baseline gap-x-3 gap-y-3 text-sm'>
              <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Published:
              </dt>
              <dd className='text-base font-medium'>{book.publishYear}</dd>

              <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Pages:
              </dt>
              <dd className='text-base font-medium'>{book.numberOfPages}</dd>

              {book.isbn13 && (
                <>
                  <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                    ISBN:
                  </dt>
                  <dd className='text-base font-medium'>{book.isbn13}</dd>
                </>
              )}

              {book.genre && (
                <>
                  <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                    Genre:
                  </dt>
                  <dd className='text-base font-medium'>{book.genre}</dd>
                </>
              )}

              {book.createdAt && (
                <>
                  <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                    Added:
                  </dt>
                  <dd className='text-base font-medium'>
                    {new Date(book.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </>
              )}

              <dt className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Ownership:
              </dt>
              <dd className='text-base font-medium'>{OWNERSHIP_TYPE_LABELS[book.ownershipType]}</dd>
            </dl>

            <div className='border-foreground/10 mb-6 border-t pt-4'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                  Status
                </span>
                <ReadingStatusBadge status={book.currentReadingPeriod.status} />
                <span className='text-muted-foreground text-sm'>
                  {book.currentReadingPeriod.format ?
                    READING_FORMAT_LABELS[book.currentReadingPeriod.format]
                  : 'Format unknown'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='border-foreground/10 flex flex-col gap-3 border-t pt-4 sm:flex-row'>
              <Button
                variant='outline'
                onClick={() => setIsTransitioning(true)}
                disabled={transitionStatus.isPending}
                className='flex-1 sm:flex-none'
              >
                Update Status
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
                      {book.title}&quot; from your library.
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
          </div>
        </article>
      }

      {!isEditing && (
        <section className='bg-card text-card-foreground border-foreground/10 rounded-sm border-2 p-6 shadow-sm'>
          <div className='mb-5 flex flex-col gap-1'>
            <h2 className='font-serif text-2xl font-bold'>Reading History</h2>
            <p className='text-muted-foreground text-sm'>Each reread keeps its own details.</p>
          </div>
          <div className='flex flex-col gap-3'>
            {book.readingPeriods.map((period, index) => (
              <div
                key={period.id}
                className='border-foreground/10 flex flex-col gap-3 rounded-sm border p-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='flex min-w-0 flex-col gap-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-medium'>
                      Reading {book.readingPeriods.length - index}
                    </span>
                    <ReadingStatusBadge status={period.status} />
                    {period.isCurrent && <Badge variant='outline'>Current</Badge>}
                  </div>
                  <p className='text-muted-foreground text-sm'>
                    {period.format ? READING_FORMAT_LABELS[period.format] : 'Format unknown'}
                    {period.startedOn ? ` · Started ${formatReadingDate(period.startedOn)}` : ''}
                    {period.endedOn ?
                      ` · ${period.status === 'finished' ? 'Finished' : 'Stopped'} ${formatReadingDate(period.endedOn)}`
                    : ''}
                  </p>
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setEditingPeriod(period)}
                >
                  Edit Details
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {isTransitioning && (
        <ReadingPeriodDialog
          title={`Update ${book.title}`}
          description='Choose a status and keep any dates or format you want to remember.'
          submitLabel='Save Status'
          statuses={[...READING_STATUSES]}
          defaultValues={getTransitionDefaults(book.currentReadingPeriod)}
          isPending={transitionStatus.isPending}
          onClose={() => setIsTransitioning(false)}
          onSubmit={(values) => transitionStatus.mutate({ bookId: book.id, ...values })}
        />
      )}

      {editingPeriod && (
        <ReadingPeriodDialog
          title='Edit reading details'
          description='Correct this reading period without removing it from your history.'
          submitLabel='Save Details'
          statuses={
            editingPeriod.isCurrent ? [...READING_STATUSES]
            : isTerminalReadingStatus(editingPeriod.status) ?
              ['finished', 'did_not_finish']
            : [editingPeriod.status]
          }
          defaultValues={{
            status: editingPeriod.status,
            format: editingPeriod.format,
            startedOn: editingPeriod.startedOn,
            endedOn: editingPeriod.endedOn,
          }}
          isPending={
            editingPeriod.isCurrent ? transitionStatus.isPending : updateReadingPeriod.isPending
          }
          onClose={() => setEditingPeriod(null)}
          onSubmit={(values) =>
            editingPeriod.isCurrent ?
              transitionStatus.mutate({ bookId: book.id, ...values })
            : updateReadingPeriod.mutate({ id: editingPeriod.id, ...values })
          }
        />
      )}
    </div>
  );
}
