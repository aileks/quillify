'use client';

import { useState } from 'react';
import { PartyPopper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/trpc/react';

interface ReleaseNotesDialogProps {
  isAuthenticated: boolean;
}

export function ReleaseNotesDialog({ isAuthenticated }: ReleaseNotesDialogProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const unseenReleases = api.releases.unseen.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const markSeen = api.releases.markSeen.useMutation();
  const releases = unseenReleases.data?.releases ?? [];
  const isOpen = !isDismissed && releases.length > 0;

  const dismiss = () => {
    setIsDismissed(true);
    markSeen.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <div className='bg-primary/10 text-primary flex size-10 items-center justify-center rounded-sm'>
            <PartyPopper className='size-5' aria-hidden='true' />
          </div>
          <DialogTitle>What&apos;s new in Quillify</DialogTitle>
          <DialogDescription>New ways to build, protect, and move your Library.</DialogDescription>
        </DialogHeader>

        <div className='flex max-h-[55vh] flex-col gap-5 overflow-y-auto pr-1'>
          {releases.map((release) => (
            <section key={release.version} aria-labelledby={`release-${release.version}`}>
              <div className='flex flex-wrap items-baseline gap-2'>
                <h3 id={`release-${release.version}`} className='font-serif text-lg font-bold'>
                  {release.title}
                </h3>
                <span className='text-muted-foreground font-mono text-xs'>v{release.version}</span>
              </div>
              <ul className='text-muted-foreground mt-2 flex list-disc flex-col gap-2 pl-5 text-sm'>
                {release.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button type='button' onClick={dismiss} disabled={markSeen.isPending}>
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
