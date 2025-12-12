'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Validate token on mount
  const { data: tokenValidation, isLoading: isValidating } = api.auth.validateResetToken.useQuery({
    token,
  });

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    } as ResetPasswordFormValues,
  });

  const resetPassword = api.auth.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/account/login');
      }, 3000);
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    resetPassword.mutate({ token, password: data.password });
  };

  const isLoading = form.formState.isSubmitting || resetPassword.isPending;

  // Loading state while validating token
  if (isValidating) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <Skeleton className='mx-auto mb-4 h-12 w-12 rounded-full' />
          <Skeleton className='mx-auto h-6 w-48' />
          <Skeleton className='mx-auto mt-2 h-4 w-64' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    );
  }

  // Invalid or expired token
  if (!tokenValidation?.valid) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-destructive/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <XCircle className='text-destructive h-6 w-6' />
          </div>
          <CardTitle className='text-center'>Invalid Reset Link</CardTitle>
          <CardDescription className='text-center'>
            {tokenValidation?.message || 'This password reset link is invalid or has expired.'}
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

  // Success state
  if (isSuccess) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-chart-3/20 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <CheckCircle className='text-chart-3 h-6 w-6' />
          </div>
          <CardTitle className='text-center'>Password Reset Successful</CardTitle>
          <CardDescription className='text-center'>
            Your password has been reset successfully. You will be redirected to the login page
            shortly.
          </CardDescription>
        </CardHeader>

        <CardFooter className='flex flex-col gap-4'>
          <Button type='button' className='w-full' asChild>
            <Link href='/account/login'>Continue to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password below.</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Enter your new password'
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Confirm your new password'
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {resetPassword.error && (
              <Alert variant='destructive'>
                <AlertDescription>{resetPassword.error.message}</AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ?
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Resetting Password...
                </>
              : <>Reset Password</>}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className='flex flex-col gap-4'>
        <div className='relative w-full'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-card text-muted-foreground px-2'>Or</span>
          </div>
        </div>

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
