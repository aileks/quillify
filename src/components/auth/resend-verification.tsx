'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/trpc/react';

interface ResendVerificationProps {
  email: string;
  className?: string;
}

export default function ResendVerification({ email, className }: ResendVerificationProps) {
  const [isComplete, setIsComplete] = useState(false);

  const sendVerificationEmail = api.auth.sendVerificationEmail.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setIsComplete(true);
        toast.success('Verification email sent! Please check your inbox (and spam folder).', {
          duration: Infinity,
        });
      }
    },
    onError: (error) => {
      console.error('Error resending verification email:', error);
      toast.error(error.message || 'Failed to send verification email. Please try again.', {
        duration: Infinity,
      });
    },
  });

  const handleResend = () => {
    sendVerificationEmail.mutate({ email });
  };

  if (isComplete) {
    return (
      <Alert className='border-chart-3 text-chart-3'>
        <AlertDescription>
          Verification email sent! Please check your inbox (and spam folder).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Button onClick={handleResend} disabled={sendVerificationEmail.isPending} className={className}>
      {sendVerificationEmail.isPending ?
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Sending...
        </>
      : 'Resend Verification Email'}
    </Button>
  );
}
