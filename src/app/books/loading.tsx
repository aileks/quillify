import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen'>
      {/* Navbar skeleton */}
      <div>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
          <Skeleton className='h-8 w-24' />
          <div className='flex items-center gap-4'>
            <Skeleton className='h-9 w-20' />
            <Skeleton className='h-9 w-28' />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className='mx-auto max-w-7xl p-4'>
        <div className='mb-6 flex items-center justify-between'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>

        {/* Book grid skeleton */}
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='rounded-lg'>
              <Skeleton className='mb-4 h-48 w-full' />
              <Skeleton className='mb-2 h-6 w-3/4' />
              <Skeleton className='mb-2 h-4 w-1/2' />
              <Skeleton className='h-4 w-1/3' />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
