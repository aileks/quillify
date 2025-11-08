'use client';

import { useState } from 'react';
import * as React from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import genres from '@/data/genres.json';

const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  numberOfPages: z.string().min(1, 'Number of pages is required'),
  genre: z.string().optional(),
  publishYear: z.string().min(1, 'Publish year is required'),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [bookId, setBookId] = useState<string | null>(null);

  // Unwrap params in useEffect since we're in a client component
  React.useEffect(() => {
    params.then((p) => setBookId(p.id));
  }, [params]);

  const {
    data: book,
    isLoading,
    error,
  } = api.books.getById.useQuery({ id: bookId! }, { enabled: !!bookId });

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
      if (bookId) {
        void utils.books.getById.invalidate({ id: bookId });
      }
      void utils.books.list.invalidate();
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating book:', error);
    },
  });

  const toggleRead = api.books.setRead.useMutation({
    onSuccess: () => {
      if (bookId) {
        void utils.books.getById.invalidate({ id: bookId });
      }
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
    if (!bookId) return;

    const numberOfPages = Number(data.numberOfPages);
    const publishYear = Number(data.publishYear);

    // Validate numbers
    if (isNaN(numberOfPages) || numberOfPages <= 0) {
      form.setError('numberOfPages', { message: 'Must be a positive number' });
      return;
    }
    if (isNaN(publishYear) || publishYear < 1000 || publishYear > new Date().getFullYear() + 10) {
      form.setError('publishYear', {
        message: `Year must be between 1000 and ${new Date().getFullYear() + 10}`,
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

  if (!bookId || isLoading) {
    return (
      <div className='container mx-auto max-w-3xl py-10'>
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className='container mx-auto max-w-3xl py-10'>
        <Card>
          <CardContent className='pt-6'>
            <p className='text-destructive font-semibold'>
              Error: {error?.message || 'Book not found'}
            </p>
            <Button className='mt-4' onClick={() => router.push('/books')}>
              Back to Books
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto max-w-3xl space-y-6 py-10'>
      <div className='flex items-center gap-4'>
        <Button variant='outline' onClick={() => router.push('/books')}>
          ← Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div>
              <CardTitle className='text-3xl'>{book.title}</CardTitle>
              <CardDescription className='text-lg'>by {book.author}</CardDescription>
            </div>
            <div className='flex gap-2'>
              {!isEditing && (
                <>
                  <Button variant='outline' onClick={() => setIsEditing(true)}>
                    Edit Book
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant='destructive'>Delete</Button>
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
                        <Input placeholder='The Pragmatic Programmer' {...field} />
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
                        <Input placeholder='Andrew Hunt, David Thomas' {...field} />
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
                          <Input type='number' placeholder='352' {...field} />
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
                          <Input type='number' placeholder='1999' {...field} />
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

                <div className='flex gap-4'>
                  <Button type='submit' disabled={updateBook.isPending}>
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
                  <div className='flex items-center gap-2'>
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
