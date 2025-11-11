import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookNotFound() {
  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mb-8 space-y-3'>
          <div className='bg-muted mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full'>
            <BookOpen className='text-muted-foreground h-12 w-12' />
          </div>
          <h2 className='text-foreground text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl'>
            Book Not Found
          </h2>
          <p className='text-muted-foreground text-sm'>
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

        <div className='text-muted-foreground mt-12 text-xs'>
          <p>
            or{' '}
            <Link href='/' className='hover:text-foreground underline'>
              Return to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
