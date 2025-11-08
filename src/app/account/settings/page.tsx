import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  return (
    <div className='flex min-h-[calc(100vh-4rem)] items-center justify-center px-4'>
      <div className='mx-auto max-w-md text-center'>
        <div className='mb-8 space-y-3'>
          <div className='flex justify-center'>
            <Settings className='h-32 w-32 text-primary' />
          </div>

          <h2 className='text-2xl font-semibold tracking-tight text-foreground'>
            Settings Coming Soon!
          </h2>

          <p className='text-sm text-muted-foreground'>
            We&apos;re working on bringing you customization options and preferences. Check back
            soon for updates!
          </p>
        </div>

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <Button asChild size='lg'>
            <Link href='/books'>View Books</Link>
          </Button>

          <Button asChild variant='outline' size='lg'>
            <Link href='/'>Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
