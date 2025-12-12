'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ResendVerification from '@/components/auth/resend-verification';

interface VerifyEmailClientProps {
  status?: string;
  email?: string;
}

export default function VerifyEmailClient({ status, email }: VerifyEmailClientProps) {
  // Success state
  if (status === 'success') {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-chart-3/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <CheckCircle className='text-chart-3 h-6 w-6' />
          </div>
          <CardTitle className='text-center'>Email Verified</CardTitle>
          <CardDescription className='text-center'>
            Your email has been verified successfully. You can now log in to your account.
          </CardDescription>
        </CardHeader>

        <CardFooter className='flex flex-col gap-4'>
          <Button type='button' className='w-full' asChild>
            <Link href='/'>Continue to Account</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Expired token state
  if (status === 'expired') {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <XCircle className='text-destructive h-6 w-6' />
          </div>
          <CardTitle className='text-center'>Verification Link Expired</CardTitle>
          <CardDescription className='text-center'>
            This verification link has expired. Please request a new one.
          </CardDescription>
        </CardHeader>

        <CardFooter className='flex flex-col gap-4'>
          {email && <ResendVerification email={email} className='w-full' />}
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

  // Invalid token state (default for invalid/missing status)
  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <div className='bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
          <XCircle className='text-destructive h-6 w-6' />
        </div>
        <CardTitle className='text-center'>Invalid Verification Link</CardTitle>
        <CardDescription className='text-center'>
          This verification link is invalid or has already been used.
        </CardDescription>
      </CardHeader>

      <CardFooter className='flex flex-col gap-4'>
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
