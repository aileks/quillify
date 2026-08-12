'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, CopyPlus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { BookCatalogSearch } from '@/components/book-catalog-search';
import { BookForm } from '@/components/book-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { catalogResultToBookFormValues } from '@/lib/book-catalog';
import type { BookCreateInput, BookFormValues } from '@/lib/book-validation';
import type { OpenLibraryCatalogSearchResult } from '@/lib/open-library';
import { api } from '@/trpc/react';
import type { RouterInputs, RouterOutputs } from '@/trpc/react';

type CreateBookResult = RouterOutputs['books']['create'];
type DuplicateWarning = Extract<CreateBookResult, { status: 'duplicate_warning' }>;
type CreateBookRequest = RouterInputs['books']['create'];

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
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [pendingBook, setPendingBook] = useState<CreateBookRequest['book'] | null>(null);

  const createBook = api.books.create.useMutation({
    onSuccess: (result, variables) => {
      if (result.status === 'duplicate_warning') {
        setDuplicateWarning(result);
        setPendingBook(variables.book);
        return;
      }

      const { book } = result;
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
    createBook.mutate({ book: values, duplicateAction: 'review' });
  };

  const createSeparateEdition = () => {
    if (!pendingBook) {
      return;
    }

    createBook.mutate({ book: pendingBook, duplicateAction: 'create_separate_edition' });
  };

  const closeDuplicateWarning = () => {
    if (createBook.isPending) {
      return;
    }

    setDuplicateWarning(null);
    setPendingBook(null);
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

      <Dialog
        open={duplicateWarning !== null}
        onOpenChange={(open) => !open && closeDuplicateWarning()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This book may already be in your Library</DialogTitle>
            <DialogDescription>
              Review the possible matches before adding another edition.
            </DialogDescription>
          </DialogHeader>
          <ul className='flex max-h-72 flex-col gap-3 overflow-y-auto'>
            {duplicateWarning?.matches.map((match) => (
              <li key={match.id} className='border-foreground/10 rounded-sm border p-3'>
                <Link
                  href={`/books/${match.id}`}
                  className='font-serif font-bold underline-offset-4 hover:underline'
                >
                  {match.title}
                </Link>
                <p className='text-muted-foreground text-sm'>
                  {match.author}, {match.publishYear}
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  {match.reason === 'same_edition' ? 'Same edition' : 'Matching title and author'}
                </p>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={closeDuplicateWarning}>
              Cancel
            </Button>
            <Button type='button' onClick={createSeparateEdition} disabled={createBook.isPending}>
              <CopyPlus data-icon='inline-start' />
              {createBook.isPending ? 'Adding...' : 'Add Separate Edition'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
