'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ResendVerification from '@/components/auth/resend-verification';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const nameFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(25, 'Name must be at most 25 characters')
    .regex(/^[a-zA-Z0-9 ]+$/, 'Name can only contain letters, numbers, and spaces'),
});

const emailFormSchema = z.object({
  newEmail: z.email('Invalid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NameFormValues = z.infer<typeof nameFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Get initial tab from URL hash
function getInitialTab(isVerified: boolean): string {
  if (typeof window === 'undefined') return 'profile';
  const hash = window.location.hash.replace('#', '');
  if (hash === 'verification' && !isVerified) return 'verification';
  if (hash === 'account') return 'account';
  return 'profile';
}

export function SettingsForm() {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email ?? '';
  const currentName = session?.user?.name ?? '';
  const isVerified = session?.user?.emailVerified === true;

  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      name: currentName,
    },
  });

  // Update name form when session loads
  useEffect(() => {
    if (currentName) {
      nameForm.reset({ name: currentName });
    }
  }, [currentName, nameForm]);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const updateName = api.auth.updateName.useMutation({
    onSuccess: () => {
      toast.success('Name updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update name');
    },
  });

  const updateEmail = api.auth.updateEmail.useMutation({
    onSuccess: () => {
      toast.success('Email updated successfully');
      emailForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update email');
    },
  });

  const updatePassword = api.auth.updatePassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated successfully');
      passwordForm.reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });

  function onNameSubmit(data: NameFormValues) {
    updateName.mutate({ name: data.name });
  }

  function onEmailSubmit(data: EmailFormValues) {
    updateEmail.mutate({
      newEmail: data.newEmail,
      currentPassword: data.currentPassword,
    });
  }

  function onPasswordSubmit(data: PasswordFormValues) {
    updatePassword.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  }

  return (
    <div className='container mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10'>
      <Tabs defaultValue={getInitialTab(isVerified)} className='space-y-6'>
        <TabsList className='w-full justify-start'>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='account'>Account</TabsTrigger>
          {!isVerified && <TabsTrigger value='verification'>Verification</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value='profile'>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...nameForm}>
                <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className='space-y-4'>
                  <FormField
                    control={nameForm.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Your name'
                            className='placeholder:text-muted-foreground'
                            {...field}
                            disabled={updateName.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          2-25 characters, letters, numbers, and spaces only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type='submit' disabled={updateName.isPending}>
                    {updateName.isPending ? 'Saving...' : 'Save Name'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value='account'>
          <div className='space-y-6'>
            {/* Email Update Card */}
            <Card>
              <CardHeader>
                <CardTitle>Change Email</CardTitle>
                <CardDescription>
                  Update your email address. Your current email is: <strong>{currentEmail}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className='space-y-4'>
                    <FormField
                      control={emailForm.control}
                      name='newEmail'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Email</FormLabel>
                          <FormControl>
                            <Input
                              type='email'
                              placeholder='new@example.com'
                              className='placeholder:text-muted-foreground'
                              {...field}
                              disabled={updateEmail.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name='currentPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type='password'
                              placeholder='Enter your current password'
                              className='placeholder:text-muted-foreground'
                              {...field}
                              disabled={updateEmail.isPending}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter your current password to confirm the email change
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type='submit' disabled={updateEmail.isPending}>
                      {updateEmail.isPending ? 'Updating...' : 'Update Email'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Password Update Card */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password. You&apos;ll need to enter your current password to confirm
                  the change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className='space-y-4'
                  >
                    <FormField
                      control={passwordForm.control}
                      name='currentPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type='password'
                              placeholder='Enter your current password'
                              className='placeholder:text-muted-foreground'
                              {...field}
                              disabled={updatePassword.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name='newPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type='password'
                              placeholder='Enter your new password'
                              className='placeholder:text-muted-foreground'
                              {...field}
                              disabled={updatePassword.isPending}
                            />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters with uppercase, lowercase, and a number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name='confirmPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type='password'
                              placeholder='Confirm your new password'
                              className='placeholder:text-muted-foreground'
                              {...field}
                              disabled={updatePassword.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type='submit' disabled={updatePassword.isPending}>
                      {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Verification Tab - only shown if not verified */}
        {!isVerified && (
          <TabsContent value='verification'>
            <Card>
              <CardHeader>
                <CardTitle>Email Verification</CardTitle>
                <CardDescription>
                  Verify your email to unlock unlimited books and full account access.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Alert className='border-amber-500 text-amber-700'>
                  <AlertDescription className='inline-block'>
                    Your email address <strong>{currentEmail}</strong> has not been verified.
                  </AlertDescription>
                </Alert>
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-sm'>
                    Without verification, you are limited to 10 books in your library. Verify your
                    email to remove this limit.
                  </p>
                  <ResendVerification email={currentEmail} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
