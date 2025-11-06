import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='min-h-screen bg-zinc-50 dark:bg-black'>
      {/* Navbar skeleton */}
      <nav className='border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
          <Skeleton className='h-8 w-24' />
          <div className='flex items-center gap-4'>
            <Skeleton className='h-9 w-20' />
            <Skeleton className='h-9 w-28' />
          </div>
        </div>
      </nav>

      {/* Main content skeleton */}
      <main className='flex min-h-[calc(100vh-73px)] flex-col items-center justify-center'>
        <Skeleton className='h-12 w-64' />
      </main>
    </div>
  );
}
