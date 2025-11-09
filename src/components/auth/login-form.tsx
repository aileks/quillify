'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const [error, setError] = React.useState<string>('');
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    } as LoginFormValues,
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
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Log In</CardTitle>
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

            {error && (
              <div className='rounded-sm-md bg-destructive/10 text-destructive p-3 text-sm'>
                {error}
              </div>
            )}

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ?
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
