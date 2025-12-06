'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import genres from '@/data/genres.json';

const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  numberOfPages: z.string().min(1, 'Number of pages is required'),
  genre: z.string().optional(),
  publishYear: z.string().min(1, 'Publish year is required'),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

interface BookDetailClientProps {
  bookId: string;
}

/**
 * Client component for displaying and editing book details.
 * Supports optimistic updates for read status and real-time data synchronization.
 */
export function BookDetailClient({ bookId }: BookDetailClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isEditing, setIsEditing] = useState(false);

  // Data is hydrated from server via HydrateClient - no refetch needed
  const { data: book } = api.books.getById.useQuery({ id: bookId });

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    // Use `values` instead of `defaultValues` to keep form in sync with real-time data updates
    values:
      book ?
        {
          title: book.title,
          author: book.author,
          // Convert numbers to strings for form inputs (HTML inputs return strings)
          numberOfPages: String(book.numberOfPages),
          genre: book.genre || undefined,
          publishYear: String(book.publishYear),
        }
      : undefined,
  });

  const updateBook = api.books.update.useMutation({
    onSuccess: () => {
      void utils.books.getById.invalidate({ id: bookId });
      void utils.books.list.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating book:', error);
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
    onError: (err, newData, context) => {
      // Rollback to previous value on error
      if (context?.previousBook) {
        utils.books.getById.setData({ id: bookId }, context.previousBook);
      }
    },
    onSettled: () => {
      // Always refetch to ensure server and client are in sync
      void utils.books.getById.invalidate({ id: bookId });
      void utils.books.list.invalidate();
    },
  });

  const deleteBook = api.books.remove.useMutation({
    onSuccess: () => {
      void utils.books.list.invalidate();
      router.push('/books');
    },
    onError: (error) => {
      console.error('Error deleting book:', error);
    },
  });

  function onSubmit(data: BookFormValues) {
    // Convert form strings to numbers and validate
    const numberOfPages = Number(data.numberOfPages);
    const publishYear = Number(data.publishYear);

    if (isNaN(numberOfPages) || numberOfPages <= 0) {
      form.setError('numberOfPages', { message: 'Must be a positive number' });
      return;
    }
    // Allow future years up to 5 years ahead for pre-orders
    if (isNaN(publishYear) || publishYear < 1000 || publishYear > new Date().getFullYear() + 5) {
      form.setError('publishYear', {
        message: `Year must be between 1000 and ${new Date().getFullYear() + 5}`,
      });
      return;
    }

    updateBook.mutate({
      id: bookId,
      title: data.title,
      author: data.author,
      numberOfPages,
      // Use null instead of 'Other' for updates to allow clearing genre
      genre: data.genre || null,
      publishYear,
    });
  }

  if (!book) {
    return null;
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          onClick={() => router.push('/books')}
          className='w-full sm:w-auto'
          aria-label='Return to books list'
        >
          ← Back to Catalog
        </Button>
      </div>

      {/* Library Catalog Card - Detailed View */}
      <article className='bg-card text-card-foreground border-foreground/10 relative rounded-sm border-2 p-6 shadow-sm md:p-8'>
        {/* Card Number / Call Number Style */}
        <div className='text-muted-foreground/50 absolute top-4 right-4 font-mono text-xs'>
          #{book.id.slice(0, 8).toUpperCase()}
        </div>

        {/* Content */}
        <div className='pr-20'>
          {isEditing ?
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='foreground font-serif text-base font-semibold uppercase sm:text-lg'>
                        Title
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='The Art of War'
                          className='placeholder:text-muted-foreground font-serif text-2xl'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='author'
                  render={({ field }) => (
                    <FormItem>
                      <div className='border-primary/20 border-l-2 pl-3'>
                        <FormLabel className='mb-1 text-base font-semibold tracking-wide uppercase sm:text-lg'>
                          Author
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Sun Tzu'
                            className='placeholder:text-muted-foreground font-serif text-lg'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='publishYear'
                    render={({ field }) => (
                      <FormItem>
                        <div className='flex items-start gap-2'>
                          <FormLabel className='text-muted-foreground min-w-[80px] pt-2 font-mono text-xs tracking-wider uppercase'>
                            Pub:
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='1999'
                              className='placeholder:text-muted-foreground font-medium'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='numberOfPages'
                    render={({ field }) => (
                      <FormItem>
                        <div className='flex items-start gap-2'>
                          <FormLabel className='text-muted-foreground min-w-[80px] pt-2 font-mono text-xs tracking-wider uppercase'>
                            Pages:
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              placeholder='352'
                              className='placeholder:text-muted-foreground font-medium'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='genre'
                  render={({ field }) => (
                    <FormItem>
                      <div className='flex items-start gap-2'>
                        <FormLabel className='text-muted-foreground min-w-[80px] pt-2 font-mono text-xs tracking-wider uppercase'>
                          Subject:
                        </FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className='font-medium'>
                              <SelectValue placeholder='Select a genre' />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='border-foreground/10 flex flex-col gap-4 border-t pt-4 sm:flex-row'>
                  <Button
                    type='submit'
                    disabled={updateBook.isPending}
                    className='w-full sm:w-auto'
                  >
                    {updateBook.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>

                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                    disabled={updateBook.isPending}
                    className='w-full sm:w-auto'
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          : <>
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
                    Pub:
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
                      Subject:
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

              {/* Status Indicator */}
              <div className='border-foreground/10 mb-6 border-t pt-4'>
                <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                  <div className='flex items-center gap-3'>
                    <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                      Status
                    </span>
                    <div className='flex items-center gap-2'>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          book.isRead ? 'bg-green-600' : 'bg-amber-500'
                        }`}
                      />
                      <span
                        className={`text-sm font-semibold tracking-wider uppercase ${
                          book.isRead ?
                            'text-green-700 dark:text-green-500'
                          : 'text-amber-700 dark:text-amber-500'
                        }`}
                      >
                        {book.isRead ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleRead.mutate({ id: book.id, isRead: !book.isRead })}
                    disabled={toggleRead.isPending}
                    className='w-full sm:w-auto'
                  >
                    {toggleRead.isPending ?
                      'Updating...'
                    : `Mark as ${book.isRead ? 'Unread' : 'Read'}`}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='border-foreground/10 flex flex-col gap-3 border-t pt-4 sm:flex-row'>
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
                        {book.title}&quot; from your collection.
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

              {/* Bottom Edge - Catalog Card Style */}
              <div className='via-foreground/5 absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent' />
            </>
          }
        </div>
      </article>
    </div>
  );
}
