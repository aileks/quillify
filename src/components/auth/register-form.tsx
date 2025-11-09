'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

import { api } from '@/trpc/react';
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

const registerSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  callbackUrl?: string;
}

export function RegisterForm({ callbackUrl = '/' }: RegisterFormProps) {
  const [error, setError] = React.useState<string>('');
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  });

  const registerMutation = api.auth.register.useMutation({
    onSuccess: async () => {
      // Automatically log in the user after successful registration for better UX
      // Use redirect: false to handle navigation manually and show errors if login fails
      const result = await signIn('credentials', {
        email: form.getValues('email'),
        password: form.getValues('password'),
        redirect: false,
      });

      if (result?.error) {
        setError('Registration successful, but login failed. Please try logging in.');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    },
    onError: (error) => {
      setError(error.message || 'Failed to register. Please try again.');
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError('');
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name || undefined,
    });
  };

  const isLoading = form.formState.isSubmitting || registerMutation.isPending;

  return (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>Enter your details to create a new account</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='John Doe' {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder='Create a strong password'
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
                      placeholder='Re-enter your password'
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
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
                  Creating account...
                </>
              : <>Register</>}
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
          <Link href='/account/login'>Already have an account? Log in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
