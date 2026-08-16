'use client';

import * as React from 'react';
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TAG_NAME_MAX_LENGTH } from '@/lib/organization';

function friendlyTagError(message: string, fallback: string) {
  if (message === 'NAME_TAKEN') return 'A tag with that name already exists';
  return message || fallback;
}

interface TagManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTags: string[];
  onTagRenamed: (tag: { from: string; to: string }) => void;
  onTagDeleted: (tag: { name: string }) => void;
}

export function TagManagerDialog({
  open,
  onOpenChange,
  onTagRenamed,
  onTagDeleted,
}: TagManagerDialogProps) {
  const utils = api.useUtils();
  const { data: tags } = api.tags.list.useQuery(undefined, { enabled: open });
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const renameTag = api.tags.rename.useMutation({
    onSuccess: async ({ id, name }) => {
      const previous = tags?.find((tag) => tag.id === id)?.name;
      if (previous) {
        onTagRenamed({ from: previous, to: name });
      }
      setRenamingId(null);
      await utils.tags.list.invalidate();
      toast.success('Tag renamed');
    },
    onError: (error) => {
      toast.error(friendlyTagError(error.message, 'Failed to rename tag'));
    },
  });

  const removeTag = api.tags.remove.useMutation({
    onSuccess: async (_result, variables) => {
      const previous = tags?.find((tag) => tag.id === variables.id)?.name;
      if (previous) {
        onTagDeleted({ name: previous });
      }
      setDeletingId(null);
      await Promise.all([utils.tags.list.invalidate(), utils.books.list.invalidate()]);
      toast.success('Tag deleted');
    },
    onError: (error) => {
      toast.error(friendlyTagError(error.message, 'Failed to delete tag'));
    },
  });

  const startRename = (id: string, name: string) => {
    setRenamingId(id);
    setRenameValue(name);
  };

  const submitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    renameTag.mutate({ id, name: trimmed });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
          <DialogDescription>
            Rename a tag everywhere it is used, or delete it from all books.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-80 space-y-1 overflow-y-auto'>
          {(tags ?? []).length === 0 && (
            <p className='text-muted-foreground py-6 text-center text-sm'>
              No tags yet. Add tags from a book&apos;s details.
            </p>
          )}
          {(tags ?? []).map((tag) => {
            const isRenaming = renamingId === tag.id;
            const isDeleting = deletingId === tag.id;

            return (
              <div
                key={tag.id}
                className='hover:bg-accent/50 flex items-center gap-2 rounded-sm px-2 py-1.5'
              >
                {isRenaming ?
                  <>
                    <Input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          submitRename(tag.id);
                        } else if (event.key === 'Escape') {
                          setRenamingId(null);
                        }
                      }}
                      maxLength={TAG_NAME_MAX_LENGTH}
                      className='h-8 flex-1 rounded-sm'
                      autoFocus
                      aria-label={`Rename ${tag.name}`}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-8 rounded-sm'
                      disabled={renameTag.isPending || !renameValue.trim()}
                      onClick={() => submitRename(tag.id)}
                      aria-label='Save tag name'
                    >
                      <CheckIcon className='size-4' />
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='size-8 rounded-sm'
                      onClick={() => setRenamingId(null)}
                      aria-label='Cancel renaming'
                    >
                      <XIcon className='size-4' />
                    </Button>
                  </>
                : <>
                    <span className='min-w-0 flex-1 truncate text-sm'>{tag.name}</span>
                    <span className='text-muted-foreground shrink-0 text-xs'>
                      {Number(tag.bookCount)} {Number(tag.bookCount) === 1 ? 'book' : 'books'}
                    </span>
                    {isDeleting ?
                      <>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-8 rounded-sm text-red-600'
                          disabled={removeTag.isPending}
                          onClick={() => removeTag.mutate({ id: tag.id })}
                        >
                          Delete
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-8 rounded-sm'
                          onClick={() => setDeletingId(null)}
                        >
                          Keep
                        </Button>
                      </>
                    : <>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 rounded-sm'
                          onClick={() => startRename(tag.id, tag.name)}
                          aria-label={`Rename ${tag.name}`}
                        >
                          <PencilIcon className='size-4' />
                        </Button>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='text-muted-foreground hover:text-destructive size-8 rounded-sm'
                          onClick={() => setDeletingId(tag.id)}
                          aria-label={`Delete ${tag.name}`}
                        >
                          <Trash2Icon className='size-4' />
                        </Button>
                      </>
                    }
                  </>
                }
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
