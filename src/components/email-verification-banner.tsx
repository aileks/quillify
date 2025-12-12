'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss: () => void;
}

type BannerState = 'collapsed' | 'expanded' | 'success' | 'error';

export function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const [state, setState] = useState<BannerState>('collapsed');
  const [retryDisabled, setRetryDisabled] = useState(false);

  const sendVerificationEmail = api.auth.sendVerificationEmail.useMutation({
    onSuccess: () => {
      setState('success');
    },
    onError: () => {
      setState('error');
      setRetryDisabled(true);
    },
  });

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state, onDismiss]);

  // Enable retry after 5 seconds
  useEffect(() => {
    if (retryDisabled) {
      const timer = setTimeout(() => {
        setRetryDisabled(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [retryDisabled]);

  const handleSendEmail = () => {
    sendVerificationEmail.mutate({ email });
  };

  const handleRetry = () => {
    setRetryDisabled(true);
    sendVerificationEmail.mutate({ email });
  };

  const toggleExpanded = () => {
    setState((prev) => (prev === 'collapsed' ? 'expanded' : 'collapsed'));
  };

  // Success state
  if (state === 'success') {
    return (
      <div className='border-chart-3/30 bg-chart-3/10 border-b'>
        <div className='container mx-auto flex items-center justify-between gap-4 px-4 py-3'>
          <div className='text-chart-3 flex items-center gap-2'>
            <CheckCircle className='h-4 w-4 shrink-0' />
            <span className='text-sm'>Verification email sent! Please check your inbox.</span>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={onDismiss}
            className='text-chart-3 hover:bg-chart-3/20 hover:text-chart-3 h-6 w-6 p-0'
            aria-label='Dismiss'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className='border-chart-2/30 bg-chart-2/10 border-b'>
        <div className='container mx-auto flex items-center justify-between gap-4 px-4 py-3'>
          <div className='text-chart-2 flex items-center gap-2'>
            <AlertCircle className='h-4 w-4 shrink-0' />
            <span className='text-sm'>Failed to send verification email.</span>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRetry}
              disabled={retryDisabled || sendVerificationEmail.isPending}
              className='border-chart-2/50 text-chart-2 hover:bg-chart-2/20 hover:text-chart-2 h-7'
            >
              {sendVerificationEmail.isPending ?
                <Loader2 className='mr-1 h-3 w-3 animate-spin' />
              : null}
              Retry
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onDismiss}
              className='text-chart-2 hover:bg-chart-2/20 hover:text-chart-2 h-6 w-6 p-0'
              aria-label='Dismiss'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed/Expanded states
  return (
    <div className='border-b border-amber-200 bg-amber-50'>
      <div className='container mx-auto px-4 py-3'>
        {/* Collapsed state - single line */}
        <div className='flex items-center justify-between gap-4'>
          <button
            onClick={toggleExpanded}
            className='flex flex-1 items-center gap-2 text-left text-amber-800 hover:text-amber-900'
          >
            <AlertCircle className='h-4 w-4 shrink-0' />
            <span className='text-sm'>
              Your email address <strong>{email}</strong> has not been verified.
            </span>
            {state === 'collapsed' ?
              <ChevronDown className='h-4 w-4 shrink-0' />
            : <ChevronUp className='h-4 w-4 shrink-0' />}
          </button>
          <Button
            variant='ghost'
            size='sm'
            onClick={onDismiss}
            className='h-6 w-6 shrink-0 p-0 text-amber-700 hover:bg-amber-100 hover:text-amber-800'
            aria-label='Dismiss banner'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Expanded state - additional content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            state === 'expanded' ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <p className='mb-3 text-sm text-amber-700'>
            Verify your email to unlock unlimited books and full account access.
          </p>
          <Button
            onClick={handleSendEmail}
            disabled={sendVerificationEmail.isPending}
            size='sm'
            className='bg-amber-600 text-white hover:bg-amber-700'
          >
            {sendVerificationEmail.isPending ?
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            : 'Resend Verification Email'}
          </Button>
        </div>
      </div>
    </div>
  );
}
