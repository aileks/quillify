import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/server/auth';
import { RegisterForm } from '@/components/auth/register-form';

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

async function RegisterContent({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const callbackUrl = resolvedParams.callbackUrl || '/';

  // If user is already logged in, redirect to callback URL
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4'>
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  );
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </div>
      }
    >
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}
