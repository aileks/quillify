'use client';

import * as React from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagNamesInput } from '@/components/tag-names-input';
import { LIST_NAME_MAX_LENGTH } from '@/lib/organization';

interface BulkOrganizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBookIds: string[];
}

function pluralBooks(count: number) {
  return `${count} ${count === 1 ? 'book' : 'books'}`;
}

export function BulkTagsDialog({ open, onOpenChange, selectedBookIds }: BulkOrganizeDialogProps) {
  const utils = api.useUtils();
  const { data: tags } = api.tags.list.useQuery(undefined, { enabled: open });
  const [addNames, setAddNames] = React.useState<string[]>([]);
  const [removeNames, setRemoveNames] = React.useState<string[]>([]);

  const reset = () => {
    setAddNames([]);
    setRemoveNames([]);
  };

  const addToBooks = api.tags.addToBooks.useMutation({
    onSuccess: async () => {
      toast.success(`Tags added to ${pluralBooks(selectedBookIds.length)}`);
      setAddNames([]);
      await Promise.all([utils.tags.list.invalidate(), utils.books.getById.invalidate()]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add tags');
    },
  });

  const removeFromBooks = api.tags.removeFromBooks.useMutation({
    onSuccess: async () => {
      toast.success(`Tags removed from ${pluralBooks(selectedBookIds.length)}`);
      setRemoveNames([]);
      await Promise.all([utils.tags.list.invalidate(), utils.books.getById.invalidate()]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove tags');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Tag {pluralBooks(selectedBookIds.length)}</DialogTitle>
          <DialogDescription>Add or remove tags on every selected book at once.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='bulk-add-tags'>Add tags</Label>
            <TagNamesInput
              id='bulk-add-tags'
              value={addNames}
              onValueChange={setAddNames}
              suggestions={(tags ?? []).map(({ name }) => name)}
            />
            <Button
              type='button'
              size='sm'
              className='w-fit rounded-sm'
              disabled={addNames.length === 0 || addToBooks.isPending}
              onClick={() => addToBooks.mutate({ bookIds: selectedBookIds, names: addNames })}
            >
              {addToBooks.isPending ? 'Adding...' : 'Add tags'}
            </Button>
          </div>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='bulk-remove-tags'>Remove tags</Label>
            <TagNamesInput
              id='bulk-remove-tags'
              value={removeNames}
              onValueChange={setRemoveNames}
              suggestions={(tags ?? []).map(({ name }) => name)}
            />
            <Button
              type='button'
              size='sm'
              variant='outline'
              className='w-fit rounded-sm'
              disabled={removeNames.length === 0 || removeFromBooks.isPending}
              onClick={() =>
                removeFromBooks.mutate({ bookIds: selectedBookIds, names: removeNames })
              }
            >
              {removeFromBooks.isPending ? 'Removing...' : 'Remove tags'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BulkListsDialog({ open, onOpenChange, selectedBookIds }: BulkOrganizeDialogProps) {
  const utils = api.useUtils();
  const { data: lists } = api.lists.summary.useQuery(undefined, { enabled: open });
  const [selectedListId, setSelectedListId] = React.useState<string>('');
  const [newListName, setNewListName] = React.useState('');

  const createList = api.lists.create.useMutation({
    onSuccess: async (created) => {
      toast.success(`List "${created.name}" created`);
      setNewListName('');
      setSelectedListId(created.id);
      await utils.lists.summary.invalidate();
    },
    onError: (error) => {
      toast.error(
        error.message === 'NAME_TAKEN' ?
          'A list with that name already exists'
        : 'Failed to create list'
      );
    },
  });

  const addBooks = api.lists.addBooks.useMutation({
    onSuccess: async (_result, variables) => {
      const listName = lists?.find((list) => list.id === variables.id)?.name ?? 'the list';
      toast.success(`${pluralBooks(selectedBookIds.length)} added to "${listName}"`);
      await Promise.all([utils.lists.summary.invalidate(), utils.lists.getById.invalidate()]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add books to list');
    },
  });

  const removeBooks = api.lists.removeBooks.useMutation({
    onSuccess: async (_result, variables) => {
      const listName = lists?.find((list) => list.id === variables.id)?.name ?? 'the list';
      toast.success(`${pluralBooks(selectedBookIds.length)} removed from "${listName}"`);
      await Promise.all([utils.lists.summary.invalidate(), utils.lists.getById.invalidate()]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove books from list');
    },
  });

  const isMutating = addBooks.isPending || removeBooks.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add {pluralBooks(selectedBookIds.length)} to a list</DialogTitle>
          <DialogDescription>Choose a list, or create one, then add or remove.</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='bulk-list-select'>List</Label>
            <Select value={selectedListId} onValueChange={setSelectedListId}>
              <SelectTrigger id='bulk-list-select' className='w-full rounded-sm'>
                <SelectValue
                  placeholder={(lists ?? []).length === 0 ? 'No lists yet' : 'Choose a list'}
                />
              </SelectTrigger>
              <SelectContent className='rounded-sm'>
                <SelectGroup>
                  {(lists ?? []).map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className='flex gap-2'>
              <Button
                type='button'
                size='sm'
                className='rounded-sm'
                disabled={!selectedListId || isMutating}
                onClick={() => addBooks.mutate({ id: selectedListId, bookIds: selectedBookIds })}
              >
                {addBooks.isPending ? 'Adding...' : 'Add to list'}
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='rounded-sm'
                disabled={!selectedListId || isMutating}
                onClick={() => removeBooks.mutate({ id: selectedListId, bookIds: selectedBookIds })}
              >
                {removeBooks.isPending ? 'Removing...' : 'Remove from list'}
              </Button>
            </div>
          </div>

          <div className='border-foreground/10 flex flex-col gap-2 border-t pt-4'>
            <Label htmlFor='bulk-new-list'>Create a new list</Label>
            <div className='flex gap-2'>
              <Input
                id='bulk-new-list'
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && newListName.trim()) {
                    event.preventDefault();
                    createList.mutate({ name: newListName.trim() });
                  }
                }}
                maxLength={LIST_NAME_MAX_LENGTH}
                placeholder='e.g. Book club picks'
                className='rounded-sm'
              />
              <Button
                type='button'
                variant='outline'
                className='rounded-sm'
                disabled={!newListName.trim() || createList.isPending}
                onClick={() => createList.mutate({ name: newListName.trim() })}
              >
                {createList.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
