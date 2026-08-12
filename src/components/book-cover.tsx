'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import { getOpenLibraryCoverUrl } from '@/lib/open-library';

interface BookCoverProps {
  coverSourceId: string | null | undefined;
  title: string;
  author: string;
  size?: 'M' | 'L';
  sizes?: string;
  loading?: 'eager' | 'lazy';
  className?: string;
}

function BookCoverPlaceholder({ title, author }: Pick<BookCoverProps, 'title' | 'author'>) {
  return (
    <div
      className='bg-muted text-muted-foreground flex size-full flex-col justify-between overflow-hidden p-3'
      role='img'
      aria-label={`No cover selected for ${title || 'this book'}`}
      data-testid='book-cover-placeholder'
    >
      <span className='font-mono text-[9px] tracking-[0.16em] uppercase'>Quillify Library</span>
      <div className='border-primary/40 flex flex-col gap-2 border-y py-3'>
        <span className='text-foreground line-clamp-4 font-serif text-sm leading-tight font-bold'>
          {title || 'Untitled'}
        </span>
        <span className='line-clamp-2 text-[10px] leading-snug'>{author || 'Unknown author'}</span>
      </div>
      <span className='font-mono text-[8px] tracking-widest uppercase'>Personal edition</span>
    </div>
  );
}

export function BookCover({
  coverSourceId,
  title,
  author,
  size = 'M',
  sizes = '(max-width: 640px) 96px, 128px',
  loading = 'lazy',
  className,
}: BookCoverProps) {
  const [failedCoverSourceId, setFailedCoverSourceId] = useState<string | null>(null);
  const hasCover = Boolean(coverSourceId) && failedCoverSourceId !== coverSourceId;

  return (
    <div
      className={cn(
        'bg-muted border-foreground/10 relative aspect-[2/3] overflow-hidden rounded-sm border',
        className
      )}
    >
      {hasCover ?
        <Image
          src={`${getOpenLibraryCoverUrl(coverSourceId!, size)}?default=false`}
          alt={`Cover of ${title} by ${author}`}
          fill
          unoptimized
          sizes={sizes}
          loading={loading}
          className='object-contain'
          onError={() => setFailedCoverSourceId(coverSourceId ?? null)}
          data-testid='book-cover-image'
        />
      : <BookCoverPlaceholder title={title} author={author} />}
    </div>
  );
}
