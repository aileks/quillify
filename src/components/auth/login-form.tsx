'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import ResendVerification from './resend-verification';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  callbackUrl?: string;
  errorParam?: string;
  emailParam?: string;
  verified?: boolean;
}

export function LoginForm({ callbackUrl = '/', errorParam, emailParam, verified }: LoginFormProps) {
  const [error, setError] = React.useState<string>('');
  const router = useRouter();
  const routeError =
    errorParam === 'email_not_verified' ?
      'Please verify your email before logging in. Check your inbox for the verification link.'
    : errorParam === 'invalid_token' ? 'Invalid verification link. Please request a new one.'
    : errorParam === 'expired_token' ?
      'This verification link has expired. Please request a new one.'
    : errorParam ? 'An error occurred. Please try again.'
    : '';
  const displayedError = error || routeError;

  React.useEffect(() => {
    if (verified) {
      toast.success('Email verified successfully!', {
        duration: 6000,
      });
    }
  }, [verified]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError('');

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password');
    } else if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const isLoading = form.formState.isSubmitting;

  const handleDemoLogin = async () => {
    setError('');

    const result = await signIn('credentials', {
      email: 'demo@quillify.com',
      password: 'demo123',
      rememberMe: false,
      redirect: false,
    });

    if (result?.error) {
      setError('Failed to log in with demo account');
    } else if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <Card className='w-full max-w-lg'>
      <CardHeader>
        <CardTitle>
          <h1>Log In</h1>
        </CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
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

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder='Enter your password'
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-between'>
              <FormField
                control={form.control}
                name='rememberMe'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-y-0 space-x-2'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormLabel className='cursor-pointer text-sm font-normal'>
                      Remember me for 30 days
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Link
                href='/account/forgot-password'
                className='text-muted-foreground hover:text-primary text-sm'
              >
                Forgot password?
              </Link>
            </div>

            {displayedError && (
              <div className='bg-destructive/10 text-destructive rounded-md p-3 text-sm'>
                {displayedError}
              </div>
            )}

            {emailParam && displayedError.includes('verify') && (
              <div className='pt-2'>
                <ResendVerification email={emailParam} />
              </div>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ?
                <>
                  <Loader2 data-icon='inline-start' className='animate-spin' />
                  Logging in...
                </>
              : <>Log In</>}
            </Button>

            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={handleDemoLogin}
              disabled={isLoading}
            >
              Demo Login
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
          <Link href='/account/register'>Don&apos;t have an account? Register</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
