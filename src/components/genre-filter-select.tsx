'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
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
import genres from '@/data/genres.json';

interface GenreFilterSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  className?: string;
}

export function GenreFilterSelect({ value, onValueChange, className }: GenreFilterSelectProps) {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();
  const isSelecting = React.useRef(false);

  const handleToggle = (genre: string) => {
    console.log('[GenreFilterSelect] handleToggle called for:', genre);
    isSelecting.current = true;
    if (value.includes(genre)) {
      onValueChange(value.filter((g) => g !== genre));
    } else {
      onValueChange([...value, genre]);
    }
    // Reset after a short delay to allow any pending close events to be ignored
    setTimeout(() => {
      console.log('[GenreFilterSelect] isSelecting reset to false');
      isSelecting.current = false;
    }, 0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('[GenreFilterSelect] handleOpenChange called:', {
      newOpen,
      isSelecting: isSelecting.current,
    });
    // Don't close if we're in the middle of selecting an item
    if (!newOpen && isSelecting.current) {
      console.log('[GenreFilterSelect] Prevented close - isSelecting is true');
      return;
    }
    setOpen(newOpen);
  };

  const getTriggerLabel = () => {
    if (value.length === 0) return 'All Genres';
    if (value.length === 1) return value[0];
    return `${value.length} genres`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <button
          type='button'
          role='combobox'
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label='Filter by genre'
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
        onCloseAutoFocus={(e) => {
          console.log('[GenreFilterSelect] onCloseAutoFocus', e);
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          console.log('[GenreFilterSelect] onPointerDownOutside', e);
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          console.log('[GenreFilterSelect] onInteractOutside', e);
          e.preventDefault();
        }}
      >
        <Command
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        >
          <CommandInput placeholder='Search genres...' />

          {/* Clear selection option */}
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
            <CommandEmpty>No genre found.</CommandEmpty>
            <CommandGroup>
              {genres.map((genre) => {
                const isSelected = value.includes(genre);
                return (
                  <CommandItem key={genre} value={genre} onSelect={() => handleToggle(genre)}>
                    <Checkbox
                      checked={isSelected}
                      className='pointer-events-none mr-2'
                      aria-hidden='true'
                    />
                    <span className='flex-1'>{genre}</span>
                    {isSelected && <CheckIcon className='text-primary ml-auto size-4' />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
