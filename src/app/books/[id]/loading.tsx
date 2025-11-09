import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function Loading() {
  return (
    <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6 md:px-6 md:py-10'>
      {/* Back Button */}
      <div className='flex items-center gap-4'>
        <Button variant='outline' disabled className='w-full sm:w-auto'>
          ← Back to Catalog
        </Button>
      </div>

      {/* Library Catalog Card - Detailed View Skeleton */}
      <article className='bg-card text-card-foreground border-foreground/10 relative rounded-sm border-2 p-6 shadow-sm md:p-8'>
        {/* Card Number / Call Number Style */}
        <div className='absolute top-4 right-4'>
          <Skeleton className='h-3 w-16' />
        </div>

        {/* Content */}
        <div className='space-y-6 pr-20'>
          {/* Title */}
          <div>
            <Skeleton className='h-10 w-3/4 sm:h-12 md:h-14' />
          </div>

          {/* Author Section */}
          <div className='border-primary/20 space-y-2 border-l-2 pl-3'>
            <Skeleton className='h-3 w-16' />
            <Skeleton className='h-6 w-2/3' />
          </div>

          {/* Publication Details */}
          <div className='space-y-3'>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-16' />
            </div>

            <div className='flex items-start gap-3'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-12' />
            </div>

            <div className='flex items-start gap-3'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-24' />
            </div>

            <div className='flex items-start gap-3'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-32' />
            </div>
          </div>

          {/* Status Indicator */}
          <div className='border-foreground/10 border-t pt-4'>
            <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-3 w-16' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-2.5 w-2.5 rounded-full' />
                  <Skeleton className='h-4 w-16' />
                </div>
              </div>

              <Skeleton className='h-9 w-32 sm:w-40' />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='border-foreground/10 flex flex-col gap-3 border-t pt-4 sm:flex-row'>
            <Skeleton className='h-10 w-full sm:w-24' />
            <Skeleton className='h-10 w-full sm:w-24' />
          </div>
        </div>
      </article>
    </div>
  );
}
