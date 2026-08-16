'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { BookCover } from '@/components/book-cover';
import { ReadingStatusBadge } from '@/components/reading-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ListDetailClientProps {
  listId: string;
}

export function ListDetailClient({ listId }: ListDetailClientProps) {
  const utils = api.useUtils();
  const { data: list, isLoading, error } = api.lists.getById.useQuery({ id: listId });
  const [isAddBooksOpen, setIsAddBooksOpen] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [pickedBookIds, setPickedBookIds] = useState<Set<string>>(() => new Set());

  const invalidate = () => {
    void utils.lists.getById.invalidate({ id: listId });
    void utils.lists.summary.invalidate();
  };

  const moveEntry = api.lists.moveEntry.useMutation({
    onSuccess: () => {
      void utils.lists.getById.invalidate({ id: listId });
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to reorder the list');
    },
  });

  const removeBooks = api.lists.removeBooks.useMutation({
    onSuccess: () => {
      toast.success('Removed from list');
      invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to remove from list');
    },
  });

  const addBooks = api.lists.addBooks.useMutation({
    onSuccess: async (_result, variables) => {
      toast.success(
        variables.bookIds.length === 1 ?
          'Added to list'
        : `Added ${variables.bookIds.length} books to list`
      );
      setIsAddBooksOpen(false);
      setPickedBookIds(new Set());
      setBookSearch('');
      invalidate();
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || 'Failed to add to list');
    },
  });

  const onListBookIds = new Set((list?.items ?? []).map((item) => item.book.id));
  const { data: pickerData } = api.books.list.useQuery(
    { search: bookSearch.trim() || undefined, page: 1, pageSize: 100 },
    { enabled: isAddBooksOpen }
  );
  const pickerBooks = (pickerData?.items ?? []).filter((book) => !onListBookIds.has(book.id));

  if (isLoading) {
    return (
      <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-6 w-40' />
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-28 rounded-sm' />
          ))}
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
        <Card className='rounded-sm'>
          <CardContent className='text-muted-foreground flex flex-col items-center gap-4 py-12 text-center'>
            <p>This list could not be found.</p>
            <Button asChild variant='outline' className='rounded-sm'>
              <Link href='/lists'>Back to Lists</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <div>
          <Button variant='outline' asChild className='mb-4 rounded-sm'>
            <Link href='/lists'>Back to Lists</Link>
          </Button>
          <h1 className='font-serif text-3xl font-bold tracking-tight sm:text-4xl'>{list.name}</h1>
          <p className='text-muted-foreground mt-2 text-base'>
            {list.items.length} {list.items.length === 1 ? 'book' : 'books'}, in your chosen order
          </p>
        </div>
        <Button className='rounded-sm' onClick={() => setIsAddBooksOpen(true)}>
          <PlusIcon className='size-4' />
          Add Books
        </Button>
      </div>

      {list.items.length === 0 ?
        <Card className='rounded-sm'>
          <CardContent className='text-muted-foreground py-12 text-center'>
            This list is empty. Add books from here or from your Library&apos;s selection mode.
          </CardContent>
        </Card>
      : <ol className='space-y-3'>
          {list.items.map((item, index) => (
            <li key={item.entryId}>
              <div className='bg-card text-card-foreground border-foreground/10 flex items-center gap-3 rounded-sm border-2 p-3'>
                <span className='text-muted-foreground w-5 text-center text-sm font-medium'>
                  {index + 1}
                </span>
                <BookCover
                  coverSourceId={
                    item.book.coverSource === 'open_library' ? item.book.coverSourceId : null
                  }
                  title={item.book.title}
                  author={item.book.author}
                  sizes='(max-width: 640px) 64px, 80px'
                  loading={index < 4 ? 'eager' : 'lazy'}
                  className='w-16 shrink-0 sm:w-20'
                />
                <Link
                  href={`/books/${item.book.id}`}
                  prefetch={false}
                  className='group min-w-0 flex-1'
                >
                  <h2 className='group-hover:text-primary line-clamp-2 font-serif text-base leading-tight font-bold transition-colors'>
                    {item.book.title}
                  </h2>
                  <p className='text-muted-foreground mt-1 line-clamp-1 text-sm'>
                    by {item.book.author}
                  </p>
                  {item.book.tags.length > 0 && (
                    <div className='mt-2 flex flex-wrap gap-1.5'>
                      {item.book.tags.map((tag) => (
                        <Badge key={tag} variant='outline' className='rounded-sm font-normal'>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className='mt-2'>
                    <ReadingStatusBadge status={item.book.currentReadingPeriod.status} />
                  </div>
                </Link>
                <div className='flex shrink-0 flex-col gap-1 sm:flex-row'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-sm'
                    disabled={index === 0 || moveEntry.isPending}
                    onClick={() =>
                      moveEntry.mutate({ id: list.id, entryId: item.entryId, direction: 'up' })
                    }
                    aria-label={`Move ${item.book.title} earlier`}
                  >
                    <ArrowUpIcon className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-sm'
                    disabled={index === list.items.length - 1 || moveEntry.isPending}
                    onClick={() =>
                      moveEntry.mutate({ id: list.id, entryId: item.entryId, direction: 'down' })
                    }
                    aria-label={`Move ${item.book.title} later`}
                  >
                    <ArrowDownIcon className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-destructive size-8 rounded-sm'
                    disabled={removeBooks.isPending}
                    onClick={() => removeBooks.mutate({ id: list.id, bookIds: [item.book.id] })}
                    aria-label={`Remove ${item.book.title} from list`}
                  >
                    <XIcon className='size-4' />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      }

      <Dialog
        open={isAddBooksOpen}
        onOpenChange={(open) => {
          setIsAddBooksOpen(open);
          if (!open) {
            setPickedBookIds(new Set());
            setBookSearch('');
          }
        }}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add books to {list.name}</DialogTitle>
            <DialogDescription>
              Pick from your Library. Books keep the order you add them in; adjust afterwards with
              the arrows.
            </DialogDescription>
          </DialogHeader>

          <Input
            type='search'
            value={bookSearch}
            onChange={(event) => setBookSearch(event.target.value)}
            placeholder='Search by title, author, genre, or tag'
            aria-label='Search books to add'
            className='rounded-sm'
          />

          <div className='max-h-72 space-y-1 overflow-y-auto'>
            {pickerBooks.length === 0 && (
              <p className='text-muted-foreground py-6 text-center text-sm'>
                No other books in your Library match.
              </p>
            )}
            {pickerBooks.map((book) => {
              const isPicked = pickedBookIds.has(book.id);
              return (
                <button
                  key={book.id}
                  type='button'
                  onClick={() => {
                    setPickedBookIds((current) => {
                      const next = new Set(current);
                      if (next.has(book.id)) {
                        next.delete(book.id);
                      } else {
                        next.add(book.id);
                      }
                      return next;
                    });
                  }}
                  className={cn(
                    'hover:bg-accent flex w-full items-center justify-between gap-3 rounded-sm border border-transparent p-2 text-left transition-colors',
                    isPicked && 'border-primary bg-accent'
                  )}
                >
                  <span className='min-w-0'>
                    <span className='block truncate font-serif text-sm font-medium'>
                      {book.title}
                    </span>
                    <span className='text-muted-foreground block truncate text-xs'>
                      by {book.author}
                    </span>
                  </span>
                  {isPicked && <span className='text-primary text-xs font-medium'>Added</span>}
                </button>
              );
            })}
          </div>

          <Button
            className='rounded-sm'
            disabled={pickedBookIds.size === 0 || addBooks.isPending}
            onClick={() => addBooks.mutate({ id: list.id, bookIds: [...pickedBookIds] })}
          >
            {addBooks.isPending ? 'Adding...' : `Add ${pickedBookIds.size || ''} to list`.trim()}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
