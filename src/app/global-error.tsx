'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang='en'>
      <body className='bg-background text-foreground antialiased'>
        <div className='flex min-h-screen items-center justify-center px-4'>
          <div className='mx-auto max-w-md text-center'>
            <div className='mb-8 space-y-3'>
              <h1 className='text-9xl font-bold tracking-tight text-destructive'>500</h1>
              <h2 className='text-2xl font-semibold tracking-tight text-foreground'>
                Application Error
              </h2>

              <p className='text-sm text-muted-foreground'>
                A critical error occurred in the application. Please try reloading the page or try
                again later.
              </p>

              {error.digest && (
                <p className='mt-4 text-xs font-mono text-muted-foreground'>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={reset}
                className='inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/books')}
                className='inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
