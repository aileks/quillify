'use client';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GenreCombobox } from '@/components/genre-combobox';

const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  numberOfPages: z.string().min(1, 'Number of pages is required'),
  genre: z.string().optional(),
  publishYear: z.string().min(1, 'Publish year is required'),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export function NewBookForm() {
  const router = useRouter();
  const utils = api.useUtils();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      numberOfPages: '',
      genre: undefined,
      publishYear: '',
    },
  });

  const createBook = api.books.create.useMutation({
    onSuccess: () => {
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
      router.push('/books');
    },
    onError: (error) => {
      console.error('Error creating book:', error);
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

    createBook.mutate({
      title: data.title,
      author: data.author,
      numberOfPages,
      // Default to 'Other' if no genre selected (required by database schema)
      genre: data.genre || 'Other',
      publishYear,
    });
  }

  return (
    <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      <Card className='rounded-sm'>
        <CardHeader>
          <CardTitle className='font-serif text-2xl font-bold'>Add New Book</CardTitle>
          <CardDescription>
            Fill in the details of the book you want to add to your collection.
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                        placeholder='Jane Eyre'
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
                        placeholder='Charlotte Brontë'
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
                    <FormControl>
                      <GenreCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a genre...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex flex-col gap-4 sm:flex-row'>
                <Button
                  type='submit'
                  disabled={createBook.isPending}
                  className='w-full sm:w-auto'
                  aria-label={createBook.isPending ? 'Adding book...' : 'Add book to library'}
                >
                  {createBook.isPending ? 'Adding...' : 'Add Book'}
                </Button>

                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/books')}
                  disabled={createBook.isPending}
                  className='w-full sm:w-auto'
                  aria-label='Cancel adding book and return to books list'
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
