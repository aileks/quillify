'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon, TagsIcon } from 'lucide-react';

import { api } from '@/trpc/react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { TagManagerDialog } from '@/components/tag-manager-dialog';

interface TagFilterSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

export function TagFilterSelect({ value, onValueChange, className }: TagFilterSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [isManagerOpen, setIsManagerOpen] = React.useState(false);
  const listboxId = React.useId();

  const { data: tags } = api.tags.list.useQuery();
  const options = React.useMemo(() => (tags ?? []).map(({ name }) => name), [tags]);

  const handleToggle = (tag: string) => {
    if (value.includes(tag)) {
      onValueChange(value.filter((item) => item !== tag));
    } else {
      onValueChange([...value, tag]);
    }
  };

  const getTriggerLabel = () => {
    if (value.length === 0) return 'All Tags';
    if (value.length === 1) return value[0]!;
    return `${value.length} tags`;
  };

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          if (isManagerOpen) return;
          setOpen(isOpen);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type='button'
            role='combobox'
            aria-expanded={open}
            aria-controls={listboxId}
            aria-label='Filter by tag'
            className={cn(
              'border-input flex h-9 w-full items-center justify-between gap-2 rounded-sm border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow]',
              'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
              'dark:bg-input/30',
              value.length === 0 && 'text-muted-foreground',
              className
            )}
          >
            <span className='truncate'>{getTriggerLabel()}</span>
            <ChevronDownIcon className='text-muted-foreground size-4 shrink-0' />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className='w-[--radix-popover-trigger-width] min-w-[200px] p-0'
          align='start'
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Command
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
          >
            <CommandInput placeholder='Search tags...' />
            {options.length === 0 ?
              <div className='text-muted-foreground px-3 py-6 text-center text-sm'>
                No tags yet. Add tags from a book&apos;s details.
              </div>
            : <>
                {value.length > 0 && (
                  <div className='border-b px-1 py-1'>
                    <button
                      type='button'
                      onClick={() => onValueChange([])}
                      className='text-muted-foreground hover:text-foreground hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors'
                    >
                      Clear selection ({value.length})
                    </button>
                  </div>
                )}

                <CommandList id={listboxId}>
                  <CommandEmpty>No tag found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((tag) => {
                      const isSelected = value.includes(tag);
                      return (
                        <CommandItem key={tag} value={tag} onSelect={() => handleToggle(tag)}>
                          <Checkbox
                            checked={isSelected}
                            className='pointer-events-none mr-2'
                            aria-hidden='true'
                          />
                          <span className='flex-1'>{tag}</span>
                          {isSelected && <CheckIcon className='text-primary ml-auto size-4' />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </>
            }

            <div className='border-t p-1'>
              <button
                type='button'
                onClick={() => {
                  setOpen(false);
                  setIsManagerOpen(true);
                }}
                className='text-muted-foreground hover:text-foreground hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors'
              >
                <TagsIcon className='size-4' />
                Manage tags
              </button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>

      <TagManagerDialog
        open={isManagerOpen}
        onOpenChange={setIsManagerOpen}
        activeTags={value}
        onTagRenamed={({ from, to }) => {
          if (value.includes(from)) {
            onValueChange(value.map((tag) => (tag === from ? to : tag)));
          }
        }}
        onTagDeleted={({ name }) => {
          if (value.includes(name)) {
            onValueChange(value.filter((tag) => tag !== name));
          }
        }}
      />
    </>
  );
}
