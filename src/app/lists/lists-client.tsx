'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { LIST_NAME_MAX_LENGTH } from '@/lib/organization';

interface ListsClientProps {
  subtitle: string;
}

export function ListsClient({ subtitle }: ListsClientProps) {
  const utils = api.useUtils();
  const { data: lists, isLoading } = api.lists.summary.useQuery();
  const [newListName, setNewListName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const invalidateLists = () => {
    void utils.lists.summary.invalidate();
    void utils.lists.getById.invalidate();
  };

  const createList = api.lists.create.useMutation({
    onSuccess: async (created) => {
      toast.success(`List "${created.name}" created`);
      setNewListName('');
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

  const renameList = api.lists.rename.useMutation({
    onSuccess: async () => {
      setRenamingId(null);
      invalidateLists();
      toast.success('List renamed');
    },
    onError: (error) => {
      toast.error(
        error.message === 'NAME_TAKEN' ?
          'A list with that name already exists'
        : 'Failed to rename list'
      );
    },
  });

  const removeList = api.lists.remove.useMutation({
    onSuccess: async (_result, variables) => {
      const removed = lists?.find((list) => list.id === variables.id)?.name;
      toast.success(`List "${removed ?? ''}" deleted`);
      setDeletingId(null);
      invalidateLists();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete list');
    },
  });

  return (
    <div className='container mx-auto space-y-6 px-4 py-6 md:px-6'>
      <div>
        <h1 className='font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
          Lists
        </h1>
        <p className='text-muted-foreground mt-2 text-base sm:text-lg md:text-xl'>{subtitle}</p>
      </div>

      <Card className='rounded-sm'>
        <CardContent className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <Input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && newListName.trim()) {
                event.preventDefault();
                createList.mutate({ name: newListName.trim() });
              }
            }}
            maxLength={LIST_NAME_MAX_LENGTH}
            placeholder='Name a new list, e.g. Book club picks'
            aria-label='New list name'
            className='rounded-sm'
          />
          <Button
            className='rounded-sm sm:w-auto'
            disabled={!newListName.trim() || createList.isPending}
            onClick={() => createList.mutate({ name: newListName.trim() })}
          >
            {createList.isPending ? 'Creating...' : 'Create List'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ?
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3' role='status'>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className='h-24 rounded-sm' />
          ))}
        </div>
      : (lists ?? []).length === 0 ?
        <Card className='rounded-sm'>
          <CardContent className='text-muted-foreground flex flex-col items-center justify-center py-12 text-center'>
            <p className='mb-4'>
              No lists yet. Create one above, then add books from your Library&apos;s selection
              mode.
            </p>
          </CardContent>
        </Card>
      : <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3' role='list' aria-label='Lists'>
          {(lists ?? []).map((list) => {
            const isRenaming = renamingId === list.id;
            const isDeleting = deletingId === list.id;

            return (
              <Card key={list.id} className='rounded-sm'>
                <CardContent className='flex flex-col gap-3 p-4'>
                  {isRenaming ?
                    <div className='flex items-center gap-2'>
                      <Input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && renameValue.trim()) {
                            renameList.mutate({ id: list.id, name: renameValue.trim() });
                          } else if (event.key === 'Escape') {
                            setRenamingId(null);
                          }
                        }}
                        maxLength={LIST_NAME_MAX_LENGTH}
                        className='h-8 rounded-sm'
                        autoFocus
                        aria-label='List name'
                      />
                      <Button
                        size='sm'
                        className='rounded-sm'
                        disabled={renameList.isPending || !renameValue.trim()}
                        onClick={() => renameList.mutate({ id: list.id, name: renameValue.trim() })}
                      >
                        Save
                      </Button>
                    </div>
                  : <Link
                      href={`/lists/${list.id}`}
                      prefetch={false}
                      role='listitem'
                      className='group'
                    >
                      <h2 className='group-hover:text-primary font-serif text-lg leading-tight font-bold transition-colors'>
                        {list.name}
                      </h2>
                    </Link>
                  }

                  <p className='text-muted-foreground text-sm'>
                    {list.bookCount} {list.bookCount === 1 ? 'book' : 'books'}
                  </p>

                  {isDeleting ?
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 rounded-sm text-red-600'
                        disabled={removeList.isPending}
                        onClick={() => removeList.mutate({ id: list.id })}
                      >
                        Delete
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 rounded-sm'
                        onClick={() => setDeletingId(null)}
                      >
                        Keep
                      </Button>
                    </div>
                  : !isRenaming ?
                    <div className='flex items-center gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8 rounded-sm'
                        onClick={() => {
                          setRenamingId(list.id);
                          setRenameValue(list.name);
                        }}
                        aria-label={`Rename ${list.name}`}
                      >
                        <PencilIcon className='size-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='text-muted-foreground hover:text-destructive size-8 rounded-sm'
                        onClick={() => setDeletingId(list.id)}
                        aria-label={`Delete ${list.name}`}
                      >
                        <Trash2Icon className='size-4' />
                      </Button>
                    </div>
                  : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
