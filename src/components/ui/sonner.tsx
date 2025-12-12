'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position='top-right'
      className='toaster group'
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast font-serif bg-popover text-popover-foreground border-border shadow-lg rounded-sm cursor-pointer',
          title: 'text-sm font-medium',
          description: 'text-sm text-muted-foreground',
          success: 'border-l-4 border-l-chart-3 [&_[data-icon]]:text-chart-3',
          error: 'border-l-4 border-l-destructive [&_[data-icon]]:text-destructive',
          info: 'border-l-4 border-l-blue-600 dark:border-l-blue-500 [&_[data-icon]]:text-blue-600 dark:[&_[data-icon]]:text-blue-500',
          warning:
            'border-l-4 border-l-amber-600 dark:border-l-amber-500 [&_[data-icon]]:text-amber-600 dark:[&_[data-icon]]:text-amber-500',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton:
            'bg-popover border-border text-muted-foreground hover:text-foreground hover:bg-muted',
        },
      }}
      icons={{
        success: <CircleCheckIcon className='size-4' />,
        info: <InfoIcon className='size-4' />,
        warning: <TriangleAlertIcon className='size-4' />,
        error: <OctagonXIcon className='size-4' />,
        loading: <Loader2Icon className='size-4 animate-spin' />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius-sm)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
