import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className='container mx-auto space-y-8 px-4 py-8 md:px-6'>
      {/* Welcome Section Skeleton */}
      <div className='space-y-2'>
        <Skeleton className='h-12 w-80 sm:h-14 sm:w-96 md:h-16 md:w-[32rem]' />
        <Skeleton className='h-6 w-64 sm:h-7 sm:w-80' />
      </div>

      {/* Statistics Cards Skeleton */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='rounded-sm'>
            <CardHeader>
              <Skeleton className='h-3 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-9 w-16' />
              <Skeleton className='h-4 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action Button Skeleton */}
      <div className='flex justify-center pt-4'>
        <Skeleton className='h-12 w-40 sm:w-48' />
      </div>
    </div>
  );
}
