'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

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
import { api } from '@/trpc/react';

const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    } as ForgotPasswordFormValues,
  });

  const requestReset = api.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    requestReset.mutate({ email: data.email });
  };

  const isLoading = form.formState.isSubmitting || requestReset.isPending;

  if (isSuccess) {
    return (
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'>
            <Mail className='text-primary h-6 w-6' />
          </div>
          <CardTitle className='text-center'>
            <h1>Check Your Email</h1>
          </CardTitle>
          <CardDescription className='text-center'>
            If an account with that email exists, we sent a password reset link. Please check your
            inbox and spam folder.
          </CardDescription>
        </CardHeader>

        <CardFooter className='flex flex-col gap-4'>
          <Button type='button' variant='outline' className='w-full' asChild>
            <Link href='/account/login'>
              <ArrowLeft data-icon='inline-start' />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle>
          <h1>Forgot Password</h1>
        </CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='you@example.com'
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestReset.error && (
              <Alert variant='destructive'>
                <AlertDescription>{requestReset.error.message}</AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ?
                <>
                  <Loader2 data-icon='inline-start' className='animate-spin' />
                  Sending...
                </>
              : <>Send Reset Link</>}
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
            <ArrowLeft data-icon='inline-start' />
            Back to Login
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
