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
              <h1 className='text-destructive text-6xl font-bold tracking-tight sm:text-7xl md:text-9xl'>
                500
              </h1>
              <h2 className='text-foreground text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl'>
                Application Error
              </h2>

              <p className='text-muted-foreground text-sm'>
                A critical error occurred in the application. Please try reloading the page or try
                again later.
              </p>

              {error.digest && (
                <p className='text-muted-foreground mt-4 font-mono text-xs'>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={reset}
                className='rounded-sm-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center px-6 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/books')}
                className='rounded-sm-md border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-10 items-center justify-center border px-6 py-2 text-sm font-medium shadow-xs transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
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
