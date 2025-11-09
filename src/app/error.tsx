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
          <h1 className='text-destructive text-6xl font-bold tracking-tight sm:text-7xl md:text-9xl'>
            500
          </h1>
          <h2 className='text-foreground text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl'>
            Something Went Wrong
          </h2>

          <p className='text-muted-foreground text-sm'>
            An unexpected error occurred while processing your request. Please try again or contact
            support if the problem persists.
          </p>

          {error.digest && (
            <p className='text-muted-foreground mt-4 font-mono text-xs'>Error ID: {error.digest}</p>
          )}
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button onClick={reset} size='lg' aria-label='Try again to load the page'>
            Try Again
          </Button>

          <Button asChild variant='outline' size='lg' aria-label='Go back to books list'>
            <Link href='/books'>Go Back</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
