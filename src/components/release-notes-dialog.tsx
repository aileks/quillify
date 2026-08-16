'use client';

import { useSearchParams } from 'next/navigation';
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
import { getReleaseNotesPreview } from '@/lib/releases';
import { api } from '@/trpc/react';

const RELEASE_NOTES_PREVIEW_PARAMETER = 'previewReleaseNotes';

interface ReleaseNotesDialogProps {
  isAuthenticated: boolean;
}

export function ReleaseNotesDialog({ isAuthenticated }: ReleaseNotesDialogProps) {
  const searchParams = useSearchParams();
  const [isDismissed, setIsDismissed] = useState(false);
  const previewReleases = getReleaseNotesPreview(searchParams.get(RELEASE_NOTES_PREVIEW_PARAMETER));
  const isDevelopmentPreview = previewReleases !== null;
  const unseenReleases = api.releases.unseen.useQuery(undefined, {
    enabled: isAuthenticated && !isDevelopmentPreview,
  });
  const markSeen = api.releases.markSeen.useMutation();
  const releases = previewReleases ?? unseenReleases.data?.releases ?? [];
  const isOpen = !isDismissed && releases.length > 0;

  const dismiss = () => {
    setIsDismissed(true);
    if (!isDevelopmentPreview) {
      markSeen.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3 pr-8'>
            <div className='bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-sm'>
              <PartyPopper className='size-5' aria-hidden='true' />
            </div>
            <DialogTitle>What&apos;s new in Quillify</DialogTitle>
          </div>
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
                  <li key={note.title}>
                    <span className='text-foreground font-medium'>{note.title}</span>
                    <br />
                    {note.description}
                  </li>
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
