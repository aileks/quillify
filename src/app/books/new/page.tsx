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
  FormDescription,
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
import genres from '@/data/genres.json';

const bookFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  numberOfPages: z.string().min(1, 'Number of pages is required'),
  genre: z.string().optional(),
  publishYear: z.string().min(1, 'Publish year is required'),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function NewBookPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: '',
      author: '',
      numberOfPages: '',
      genre: undefined,
      publishYear: String(new Date().getFullYear()),
    },
  });

  const createBook = api.books.create.useMutation({
    onSuccess: () => {
      void utils.books.list.invalidate();
      router.push('/books');
    },
    onError: (error) => {
      console.error('Error creating book:', error);
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
    if (isNaN(publishYear) || publishYear < 1000 || publishYear > new Date().getFullYear() + 10) {
      form.setError('publishYear', {
        message: `Year must be between 1000 and ${new Date().getFullYear() + 10}`,
      });
      return;
    }

    createBook.mutate({
      title: data.title,
      author: data.author,
      numberOfPages,
      genre: data.genre || undefined,
      publishYear,
    });
  }

  return (
    <div className='container mx-auto max-w-2xl py-10'>
      <Card>
        <CardHeader>
          <CardTitle>Add New Book</CardTitle>
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
                      <Input placeholder='Jane Eyre' {...field} />
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
                      <Input placeholder='Charlotte Brontë' {...field} />
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
                    <FormDescription>The genre or category of the book</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex gap-4'>
                <Button type='submit' disabled={createBook.isPending}>
                  {createBook.isPending ? 'Adding...' : 'Add Book'}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.push('/books')}
                  disabled={createBook.isPending}
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
