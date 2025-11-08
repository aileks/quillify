import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/server/auth';
import { RegisterForm } from '@/components/auth/register-form';
import { Skeleton } from '@/components/ui/skeleton';

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

async function RegisterContent({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const callbackUrl = resolvedParams.callbackUrl || '/books';

  // If user is already logged in, redirect to callback URL
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className='flex min-h-[calc(100vh-200px)] items-center justify-center p-4'>
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  );
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-[calc(100vh-200px)] items-center justify-center p-4'>
          <div className='w-full max-w-md space-y-6'>
            <div className='space-y-2 text-center'>
              <Skeleton className='mx-auto h-8 w-48' />
              <Skeleton className='mx-auto h-4 w-64' />
            </div>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-10 w-full' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
              <Skeleton className='h-10 w-full' />
            </div>
          </div>
        </div>
      }
    >
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
