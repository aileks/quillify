'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { BookForm } from '@/components/book-form';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import type { BookInput } from '@/lib/book-validation';

const EMPTY_BOOK = {
  title: '',
  author: '',
  numberOfPages: '',
  publishYear: '',
  genre: '',
};

export function NewBookForm() {
  const router = useRouter();
  const utils = api.useUtils();

  const createBook = api.books.create.useMutation({
    onSuccess: (book) => {
      toast.success(`"${book.title}" added to your reading list`);
      void utils.books.list.invalidate();
      void utils.books.stats.invalidate();
      router.push('/books');
    },
    onError: (error) => {
      if (error.message === 'BOOK_LIMIT_REACHED') {
        toast.error(
          <div className='flex flex-col gap-2'>
            <span>You&apos;ve reached the 10-book limit for unverified accounts.</span>
            <Link
              href='/account/settings#verification'
              className='text-primary underline underline-offset-2'
            >
              Verify your email to add unlimited books
            </Link>
          </div>,
          { duration: Infinity }
        );
      } else {
        toast.error(error.message || 'Failed to add book');
      }
    },
  });

  const createReadingListBook = (values: BookInput) => {
    createBook.mutate(values);
  };

  return (
    <div className='container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-6 md:py-10'>
      <div>
        <Button variant='outline' asChild>
          <Link href='/books'>
            <ArrowLeft data-icon='inline-start' />
            Back to Reading List
          </Link>
        </Button>
      </div>

      <header className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Add to your reading list</h1>
        <p className='text-muted-foreground'>
          Add the details now, then mark the book finished whenever you reach the last page.
        </p>
      </header>

      <BookForm
        defaultValues={EMPTY_BOOK}
        title='Book details'
        description='Use the publication details from your copy when possible.'
        actionLabel='Add to List'
        pendingLabel='Adding...'
        isPending={createBook.isPending}
        onSubmit={createReadingListBook}
        onCancel={() => router.push('/books')}
      />
    </div>
  );
}
