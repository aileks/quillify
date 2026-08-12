'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, CircleAlert, PenLine, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BookCover } from '@/components/book-cover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { OpenLibraryCatalogSearchResult } from '@/lib/open-library';
import { api } from '@/trpc/react';

const catalogSearchSchema = z.object({
  query: z.string().trim().min(1, 'Enter a title, author, or ISBN').max(240),
});

type CatalogSearchValues = z.infer<typeof catalogSearchSchema>;

interface BookCatalogSearchProps {
  saying: string;
  onSelect: (result: OpenLibraryCatalogSearchResult) => void;
  onManualEntry: () => void;
}

function CatalogResult({
  result,
  onSelect,
  loading,
}: {
  result: OpenLibraryCatalogSearchResult;
  onSelect: () => void;
  loading: 'eager' | 'lazy';
}) {
  const authorNames = result.authors.join(', ') || 'Author unavailable';
  const publicationYear = result.editionPublicationYear ?? result.firstPublicationYear;
  const details = [
    publicationYear ? `Published ${publicationYear}` : null,
    result.numberOfPages ? `${result.numberOfPages.toLocaleString()} pages` : null,
    result.isbns[0] ? `ISBN ${result.isbns[0]}` : null,
  ].filter(Boolean);

  return (
    <li>
      <Button
        type='button'
        variant='outline'
        onClick={onSelect}
        className='h-auto w-full items-start justify-start gap-4 p-3 text-left whitespace-normal'
      >
        <BookCover
          coverSourceId={result.coverId}
          title={result.title}
          author={authorNames}
          sizes='80px'
          loading={loading}
          className='w-20 shrink-0'
        />
        <span className='flex min-w-0 flex-col gap-2 py-1'>
          <span className='font-serif text-base leading-tight font-bold'>{result.title}</span>
          <span className='text-muted-foreground text-sm'>{authorNames}</span>
          {details.length > 0 && (
            <span className='text-muted-foreground font-mono text-[10px] tracking-wide uppercase'>
              {details.join(', ')}
            </span>
          )}
        </span>
      </Button>
    </li>
  );
}

export function BookCatalogSearch({ saying, onSelect, onManualEntry }: BookCatalogSearchProps) {
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const form = useForm<CatalogSearchValues>({
    resolver: zodResolver(catalogSearchSchema),
    defaultValues: { query: '' },
  });
  const search = api.bookMetadata.searchCatalog.useQuery(
    { query: submittedQuery ?? ' ' },
    {
      enabled: submittedQuery !== null,
      retry: false,
    }
  );

  const submitSearch = ({ query }: CatalogSearchValues) => {
    const normalizedQuery = query.trim();

    if (normalizedQuery === submittedQuery) {
      void search.refetch();
      return;
    }

    setSubmittedQuery(normalizedQuery);
  };

  const results = search.data ?? [];

  return (
    <Card className='rounded-sm'>
      <CardHeader>
        <CardTitle>
          <h1>Add New Book</h1>
        </CardTitle>
        <CardDescription>{saying}</CardDescription>
      </CardHeader>
      <CardContent className='flex min-w-0 flex-col gap-6'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitSearch)}
            className='flex flex-col items-start gap-3 sm:flex-row'
          >
            <FormField
              control={form.control}
              name='query'
              render={({ field, fieldState }) => (
                <FormItem className='w-full flex-1' data-invalid={fieldState.invalid}>
                  <FormLabel>Search books</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Title, author, or ISBN'
                      maxLength={240}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={search.isFetching} className='sm:mt-6'>
              <Search data-icon='inline-start' />
              {search.isFetching ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </Form>

        {search.isFetching && (
          <div className='grid gap-3 md:grid-cols-2' role='status' aria-label='Searching books'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className='border-foreground/10 flex gap-4 rounded-sm border p-3'
                aria-hidden='true'
              >
                <Skeleton className='aspect-[2/3] w-20 shrink-0 rounded-sm' />
                <span className='flex flex-1 flex-col gap-3 py-1'>
                  <Skeleton className='h-5 w-4/5' />
                  <Skeleton className='h-4 w-3/5' />
                  <Skeleton className='h-3 w-2/5' />
                </span>
              </div>
            ))}
          </div>
        )}

        {search.error && !search.isFetching && (
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertDescription>
              {search.error.message || 'Could not search the catalog. Enter the book manually.'}
            </AlertDescription>
          </Alert>
        )}

        {search.data && results.length === 0 && !search.isFetching && (
          <Alert>
            <BookOpen />
            <AlertDescription>
              No matching books found. Try another search or enter the book manually.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && !search.isFetching && !search.error && (
          <ul className='grid gap-3 md:grid-cols-2' aria-label='Catalog results'>
            {results.map((result, index) => (
              <CatalogResult
                key={result.openLibraryEditionId ?? result.openLibraryWorkId}
                result={result}
                onSelect={() => onSelect(result)}
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button type='button' variant='outline' onClick={onManualEntry}>
          <PenLine data-icon='inline-start' />
          Enter manually
        </Button>
      </CardFooter>
    </Card>
  );
}
