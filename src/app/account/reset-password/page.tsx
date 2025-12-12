'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, XCircle } from 'lucide-react';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <XCircle className='text-destructive h-6 w-6' />
          </div>
          <CardTitle className='text-center'>Missing Reset Token</CardTitle>
          <CardDescription className='text-center'>
            No password reset token was provided. Please use the link from your email or request a
            new reset link.
          </CardDescription>
        </CardHeader>

        <CardFooter className='flex flex-col gap-4'>
          <Button type='button' className='w-full' asChild>
            <Link href='/account/forgot-password'>Request New Reset Link</Link>
          </Button>
          <Button type='button' variant='outline' className='w-full' asChild>
            <Link href='/account/login'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordLoading() {
  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <Skeleton className='mx-auto mb-4 h-12 w-12 rounded-full' />
        <Skeleton className='mx-auto h-6 w-48' />
        <Skeleton className='mx-auto mt-2 h-4 w-64' />
      </CardHeader>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className='flex min-h-screen items-center justify-center p-4'>
      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
