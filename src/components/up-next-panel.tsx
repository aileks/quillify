'use client';

import Link from 'next/link';
import { ArrowDownIcon, ArrowUpIcon, BookOpenIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { BookCover } from '@/components/book-cover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getToday } from '@/lib/reading-lifecycle';

export function UpNextPanel() {
  const utils = api.useUtils();
  const { data } = api.upNext.get.useQuery();
  const items = data?.items ?? [];

  const invalidate = () => {
    void utils.upNext.get.invalidate();
    void utils.books.list.invalidate();
    void utils.books.stats.invalidate();
  };

  const moveEntry = api.upNext.move.useMutation({
    onSuccess: () => {
      void utils.upNext.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reorder Up Next');
    },
  });

  const removeEntry = api.upNext.remove.useMutation({
    onSuccess: () => {
      void utils.upNext.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove from Up Next');
    },
  });

  const startReading = api.books.transitionStatus.useMutation({
    onSuccess: (updatedBook) => {
      toast.success(`Started reading "${updatedBook.title}"`);
      invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to start reading');
    },
  });

  return (
    <Card className='rounded-sm'>
      <CardHeader>
        <CardTitle className='font-serif text-xl font-bold'>Up Next</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ?
          <p className='text-muted-foreground text-sm'>
            Your Up Next queue is empty. Add a To Read book from its details page to plan what you
            read next.
          </p>
        : <ol className='space-y-3'>
            {items.map((item, index) => (
              <li
                key={item.book.id}
                className='border-foreground/10 flex items-center gap-3 rounded-sm border p-2'
              >
                <span className='text-muted-foreground w-4 text-center text-sm font-medium'>
                  {index + 1}
                </span>
                <BookCover
                  coverSourceId={
                    item.book.coverSource === 'open_library' ? item.book.coverSourceId : null
                  }
                  title={item.book.title}
                  author={item.book.author}
                  sizes='48px'
                  loading='lazy'
                  className='w-12 shrink-0'
                />
                <Link
                  href={`/books/${item.book.id}`}
                  prefetch={false}
                  className='hover:bg-muted/50 min-w-0 flex-1 rounded-sm p-1 transition-colors'
                >
                  <div className='truncate font-serif text-sm leading-tight font-medium'>
                    {item.book.title}
                  </div>
                  <div className='text-muted-foreground truncate text-xs'>
                    by {item.book.author}
                  </div>
                </Link>
                <div className='flex shrink-0 items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-sm'
                    disabled={index === 0 || moveEntry.isPending}
                    onClick={() => moveEntry.mutate({ bookId: item.book.id, direction: 'up' })}
                    aria-label={`Move ${item.book.title} earlier in Up Next`}
                  >
                    <ArrowUpIcon className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-sm'
                    disabled={index === items.length - 1 || moveEntry.isPending}
                    onClick={() => moveEntry.mutate({ bookId: item.book.id, direction: 'down' })}
                    aria-label={`Move ${item.book.title} later in Up Next`}
                  >
                    <ArrowDownIcon className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-muted-foreground hover:text-destructive size-8 rounded-sm'
                    disabled={removeEntry.isPending}
                    onClick={() => removeEntry.mutate({ bookId: item.book.id })}
                    aria-label={`Remove ${item.book.title} from Up Next`}
                  >
                    <XIcon className='size-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='rounded-sm'
                    disabled={startReading.isPending}
                    onClick={() =>
                      startReading.mutate({
                        bookId: item.book.id,
                        status: 'reading',
                        format: item.book.currentReadingPeriod.format,
                        startedOn: getToday(),
                        endedOn: null,
                      })
                    }
                  >
                    <BookOpenIcon className='size-4' />
                    <span className='lg:hidden xl:inline'>Start</span>
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        }
      </CardContent>
    </Card>
  );
}
