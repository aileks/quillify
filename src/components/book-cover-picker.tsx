'use client';

import { useId } from 'react';
import { Check, CircleAlert, Search } from 'lucide-react';

import { BookCover } from '@/components/book-cover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { OpenLibrarySearchResult } from '@/lib/open-library';
import { api } from '@/trpc/react';

interface BookCoverPickerProps {
  title: string;
  author: string;
  selectedCoverId: string | null;
  onSelectionChange: (coverId: string | null) => void;
}

interface CoverCandidateProps {
  candidate: OpenLibrarySearchResult;
  inputName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function CoverCandidate({ candidate, inputName, isSelected, onSelect }: CoverCandidateProps) {
  const publicationYear = candidate.editionPublicationYear ?? candidate.firstPublicationYear;
  const authorNames = candidate.authors.join(', ') || 'Unknown author';

  return (
    <label
      className={cn(
        'bg-card focus-within:ring-ring relative flex w-36 shrink-0 cursor-pointer snap-start flex-col gap-3 rounded-sm border-2 p-2 transition-colors focus-within:ring-2 focus-within:ring-offset-2 sm:w-40',
        isSelected ? 'border-primary bg-primary/5' : 'border-foreground/10 hover:border-primary/40'
      )}
    >
      <input
        type='radio'
        name={inputName}
        value={candidate.coverId}
        checked={isSelected}
        onChange={onSelect}
        className='sr-only'
        aria-label={`Choose cover for ${candidate.title} by ${authorNames}`}
      />
      {isSelected && (
        <span
          className='bg-primary text-primary-foreground absolute top-3 right-3 flex size-6 items-center justify-center rounded-sm'
          aria-hidden='true'
        >
          <Check className='size-4' />
        </span>
      )}
      <BookCover
        coverSourceId={candidate.coverId}
        title={candidate.title}
        author={authorNames}
        sizes='(max-width: 640px) 42vw, (max-width: 1024px) 26vw, 150px'
        className='w-full'
      />
      <span className='flex min-w-0 flex-col gap-1'>
        <span className='line-clamp-2 font-serif text-sm leading-tight font-bold'>
          {candidate.title}
        </span>
        <span className='text-muted-foreground line-clamp-2 text-xs'>{authorNames}</span>
        {publicationYear && (
          <span className='text-muted-foreground font-mono text-[10px] tracking-wide uppercase'>
            Published {publicationYear}
          </span>
        )}
      </span>
    </label>
  );
}

export function BookCoverPicker({
  title,
  author,
  selectedCoverId,
  onSelectionChange,
}: BookCoverPickerProps) {
  const inputName = `book-cover-${useId()}`;
  const normalizedTitle = title.trim();
  const normalizedAuthor = author.trim();
  const canSearch = normalizedTitle.length > 0;

  const search = api.bookMetadata.searchOpenLibrary.useQuery(
    {
      title: normalizedTitle || ' ',
      author: normalizedAuthor || undefined,
    },
    {
      enabled: false,
      retry: false,
    }
  );

  const candidates = search.data ?? [];
  const selectedCoverIsCandidate = candidates.some(
    (candidate) => candidate.coverId === selectedCoverId
  );

  return (
    <fieldset className='border-foreground/10 flex w-full max-w-full min-w-0 flex-col gap-4 overflow-hidden border-t pt-6'>
      <legend className='font-serif text-lg font-bold'>Book cover</legend>

      <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
        <Button
          type='button'
          variant='outline'
          onClick={() => void search.refetch()}
          disabled={!canSearch || search.isFetching}
          className='w-full sm:w-auto'
        >
          <Search data-icon='inline-start' />
          {search.isFetching ? 'Finding covers...' : 'Find covers'}
        </Button>
        {!canSearch && <p className='text-muted-foreground text-sm'>Enter a title first.</p>}
      </div>

      <label
        className={cn(
          'bg-card focus-within:ring-ring flex cursor-pointer items-center gap-3 rounded-sm border-2 p-3 transition-colors focus-within:ring-2 focus-within:ring-offset-2',
          selectedCoverId === null ?
            'border-primary bg-primary/5'
          : 'border-foreground/10 hover:border-primary/40'
        )}
      >
        <input
          type='radio'
          name={inputName}
          value='none'
          checked={selectedCoverId === null}
          onChange={() => onSelectionChange(null)}
          className='sr-only'
        />
        <span
          className={cn(
            'border-foreground/30 flex size-4 items-center justify-center rounded-full border',
            selectedCoverId === null && 'border-primary bg-primary'
          )}
          aria-hidden='true'
        >
          {selectedCoverId === null && (
            <span className='bg-primary-foreground size-1.5 rounded-full' />
          )}
        </span>
        <span className='flex flex-col'>
          <span className='font-medium'>No cover</span>
          <span className='text-muted-foreground text-xs'>Use the Quillify placeholder.</span>
        </span>
      </label>

      {selectedCoverId && !selectedCoverIsCandidate && (
        <div className='flex flex-col gap-2'>
          <p className='text-muted-foreground text-sm'>Current selection</p>
          <label className='border-primary bg-primary/5 focus-within:ring-ring relative flex w-32 cursor-pointer flex-col gap-2 rounded-sm border-2 p-2 focus-within:ring-2 focus-within:ring-offset-2'>
            <input
              type='radio'
              name={inputName}
              value={selectedCoverId}
              checked
              onChange={() => onSelectionChange(selectedCoverId)}
              className='sr-only'
              aria-label={`Keep current cover for ${title}`}
            />
            <span
              className='bg-primary text-primary-foreground absolute top-3 right-3 flex size-6 items-center justify-center rounded-sm'
              aria-hidden='true'
            >
              <Check className='size-4' />
            </span>
            <BookCover
              coverSourceId={selectedCoverId}
              title={title}
              author={author}
              sizes='128px'
              className='w-full'
            />
            <span className='text-xs font-medium'>Selected cover</span>
          </label>
        </div>
      )}

      {search.isFetching && (
        <div
          className='flex w-full max-w-full min-w-0 snap-x gap-3 overflow-x-auto overscroll-x-contain pr-3 pb-3'
          role='status'
          aria-label='Loading cover choices'
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className='border-foreground/10 flex w-36 shrink-0 snap-start flex-col gap-3 rounded-sm border-2 p-2 sm:w-40'
              aria-hidden='true'
            >
              <Skeleton className='aspect-[2/3] w-full rounded-sm' />
              <Skeleton className='h-4 w-4/5' />
              <Skeleton className='h-3 w-3/5' />
            </div>
          ))}
        </div>
      )}

      {search.error && !search.isFetching && (
        <Alert variant='destructive'>
          <CircleAlert />
          <AlertDescription>
            {search.error.message || 'Could not find covers. Try again.'}
          </AlertDescription>
        </Alert>
      )}

      {search.data && candidates.length === 0 && !search.isFetching && (
        <p className='text-muted-foreground text-sm' role='status'>
          No matching covers found.
        </p>
      )}

      {candidates.length > 0 && !search.isFetching && (
        <div
          className='flex w-full max-w-full min-w-0 snap-x gap-3 overflow-x-auto overscroll-x-contain pr-3 pb-3'
          aria-label='Cover choices'
        >
          {candidates.map((candidate) => (
            <CoverCandidate
              key={`${candidate.openLibraryId}-${candidate.coverId}`}
              candidate={candidate}
              inputName={inputName}
              isSelected={candidate.coverId === selectedCoverId}
              onSelect={() => onSelectionChange(candidate.coverId)}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}
