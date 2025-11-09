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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Book } from '@/types';

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
  initialBook: Book;
}

export function BookDetailClient({ bookId, initialBook }: BookDetailClientProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isEditing, setIsEditing] = useState(false);

  // Use the initial book data, but allow real-time updates
  const { data: book } = api.books.getById.useQuery(
    { id: bookId },
    {
      initialData: initialBook,
      staleTime: 60 * 1000, // Consider data fresh for 60 seconds
    }
  );

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    values:
      book ?
        {
          title: book.title,
          author: book.author,
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

  const toggleRead = api.books.setRead.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.books.getById.cancel({ id: bookId });

      // Snapshot previous value
      const previousBook = utils.books.getById.getData({ id: bookId });

      // Optimistically update to the new value
      utils.books.getById.setData({ id: bookId }, (old) =>
        old ? { ...old, isRead: newData.isRead } : old
      );

      // Return context with the snapshot
      return { previousBook };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      if (context?.previousBook) {
        utils.books.getById.setData({ id: bookId }, context.previousBook);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
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
    const numberOfPages = Number(data.numberOfPages);
    const publishYear = Number(data.publishYear);

    // Validate numbers
    if (isNaN(numberOfPages) || numberOfPages <= 0) {
      form.setError('numberOfPages', { message: 'Must be a positive number' });
      return;
    }
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
      genre: data.genre || null,
      publishYear,
    });
  }

  if (!book) {
    return null;
  }

  return (
    <div className='container mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          onClick={() => router.push('/books')}
          className='w-full sm:w-auto'
          aria-label='Return to books list'
        >
          ← Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row'>
            <div className='flex-1'>
              <CardTitle className='text-2xl sm:text-3xl'>{book.title}</CardTitle>
              <CardDescription className='text-base sm:text-lg'>by {book.author}</CardDescription>
            </div>
            <div className='flex w-full gap-2 sm:w-auto'>
              {!isEditing && (
                <>
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
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ?
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='The Pragmatic Programmer'
                          className='placeholder:text-muted-foreground'
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
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Andrew Hunt, David Thomas'
                          className='placeholder:text-muted-foreground'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='numberOfPages'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Pages</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='352'
                            className='placeholder:text-muted-foreground'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='publishYear'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publish Year</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='1999'
                            className='placeholder:text-muted-foreground'
                            {...field}
                          />
                        </FormControl>
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
                      <FormLabel>Genre (optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a genre' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex flex-col gap-4 sm:flex-row'>
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
          : <div className='space-y-6'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <h3 className='text-muted-foreground mb-2 text-sm font-medium'>
                    Number of Pages
                  </h3>
                  <p className='text-lg font-semibold'>{book.numberOfPages}</p>
                </div>
                {book.genre && (
                  <div>
                    <h3 className='text-muted-foreground mb-2 text-sm font-medium'>Genre</h3>
                    <p className='text-lg font-semibold'>{book.genre}</p>
                  </div>
                )}
                <div>
                  <h3 className='text-muted-foreground mb-2 text-sm font-medium'>Published Year</h3>
                  <p className='text-lg font-semibold'>{book.publishYear}</p>
                </div>
                <div>
                  <h3 className='text-muted-foreground mb-2 text-sm font-medium'>Status</h3>
                  <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center'>
                    <p
                      className={`text-lg font-semibold ${
                        book.isRead ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {book.isRead ? '✓ Read' : 'Unread'}
                    </p>
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
                {book.createdAt && (
                  <div>
                    <h3 className='text-muted-foreground mb-2 text-sm font-medium'>Added</h3>
                    <p className='text-lg font-semibold'>
                      {new Date(book.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
