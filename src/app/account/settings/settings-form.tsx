'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const emailFormSchema = z.object({
  newEmail: z.email('Invalid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormValues = z.infer<typeof emailFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function SettingsForm() {
  const { data: session } = useSession();
  const currentEmail = session?.user?.email ?? '';

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
              Update your password. You'll need to enter your current password to confirm the change.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className='space-y-4'>
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
    </div>
  );
}

