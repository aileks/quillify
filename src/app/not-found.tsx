import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mb-8 space-y-3'>
          <h1 className='text-9xl font-bold tracking-tight text-primary'>404</h1>

          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>Page Not Found</h2>

          <p className='text-sm text-muted-foreground'>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved
            or deleted.
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button asChild size='lg'>
            <Link href='/'>Go Home</Link>
          </Button>

          <Button asChild variant='outline' size='lg'>
            <Link href='/books'>View Books</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
