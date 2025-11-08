'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mb-8 space-y-3'>
          <h1 className='text-9xl font-bold tracking-tight text-destructive'>500</h1>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>
            Something Went Wrong
          </h2>

          <p className='text-sm text-muted-foreground'>
            An unexpected error occurred while processing your request. Please try again or contact
            support if the problem persists.
          </p>

          {error.digest && (
            <p className='mt-4 text-xs font-mono text-muted-foreground'>Error ID: {error.digest}</p>
          )}
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button onClick={reset} size='lg'>
            Try Again
          </Button>

          <Button asChild variant='outline' size='lg'>
            <Link href='/books'>Go Back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
