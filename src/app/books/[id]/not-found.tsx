import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BookNotFound() {
  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mb-8 space-y-3'>
          <div className='mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth={1.5}
              stroke='currentColor'
              className='h-12 w-12 text-muted-foreground'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'
              />
            </svg>
          </div>
          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>Book Not Found</h2>
          <p className='text-sm text-muted-foreground'>
            The book you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to
            view it.
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button asChild size='lg'>
            <Link href='/books'>View All Books</Link>
          </Button>

          <Button asChild variant='outline' size='lg'>
            <Link href='/books/new'>Add New Book</Link>
          </Button>
        </div>

        <div className='mt-12 text-xs text-muted-foreground'>
          <p>
            or{' '}
            <Link href='/' className='underline hover:text-foreground'>
              Return to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
