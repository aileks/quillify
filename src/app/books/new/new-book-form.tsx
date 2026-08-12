'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';

import { BookCatalogSearch } from '@/components/book-catalog-search';
import { BookForm } from '@/components/book-form';
import { Button } from '@/components/ui/button';
import { catalogResultToBookFormValues } from '@/lib/book-catalog';
import type { BookCreateInput, BookFormValues } from '@/lib/book-validation';
import type { OpenLibraryCatalogSearchResult } from '@/lib/open-library';
import { api } from '@/trpc/react';

const EMPTY_BOOK: BookFormValues = {
  title: '',
  author: '',
  numberOfPages: '',
  publishYear: '',
  genre: '',
  coverSource: null,
  coverSourceId: null,
  isbn: '',
  catalogIsbns: [],
  openLibraryWorkId: null,
  openLibraryEditionId: null,
  ownershipType: 'unknown',
  includeReadingDetails: false,
  readingStatus: 'to_read',
  readingFormat: '',
  startedOn: '',
  endedOn: '',
};

interface NewBookFormProps {
  saying: string;
}

export function NewBookForm({ saying }: NewBookFormProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [formDefaults, setFormDefaults] = useState<BookFormValues>(EMPTY_BOOK);
  const [isEnteringBook, setIsEnteringBook] = useState(false);

  const createBook = api.books.create.useMutation({
    onSuccess: (book) => {
      toast.success(`"${book.title}" added to your library`);
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

  const createReadingListBook = (values: BookCreateInput) => {
    createBook.mutate(values);
  };

  const selectCatalogResult = (result: OpenLibraryCatalogSearchResult) => {
    setFormDefaults(catalogResultToBookFormValues(result));
    setIsEnteringBook(true);
  };

  const enterManually = () => {
    setFormDefaults(EMPTY_BOOK);
    setIsEnteringBook(true);
  };

  return (
    <div className='container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 md:px-6 md:py-10'>
      <div>
        <Button variant='outline' asChild>
          <Link href='/books'>
            <ArrowLeft data-icon='inline-start' />
            Back to Library
          </Link>
        </Button>
      </div>

      <div hidden={isEnteringBook}>
        <BookCatalogSearch
          saying={saying}
          onSelect={selectCatalogResult}
          onManualEntry={enterManually}
        />
      </div>

      {isEnteringBook && (
        <div className='flex flex-col gap-6'>
          <div>
            <Button type='button' variant='outline' onClick={() => setIsEnteringBook(false)}>
              <Search data-icon='inline-start' />
              Search again
            </Button>
          </div>
          <BookForm
            defaultValues={formDefaults}
            title='Add New Book'
            saying={saying}
            actionLabel='Add Book'
            pendingLabel='Adding...'
            isPending={createBook.isPending}
            readingDetailsMode='optional'
            onSubmit={createReadingListBook}
            onCancel={() => router.push('/books')}
          />
        </div>
      )}
    </div>
  );
}
