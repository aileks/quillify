'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import genres from '@/data/genres.json';

interface GenreComboboxProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function GenreCombobox({
  value,
  onValueChange,
  placeholder = 'Select a genre',
  className,
}: GenreComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  // Filter genres based on input
  const filteredGenres = React.useMemo(() => {
    if (!inputValue) return genres;
    const search = inputValue.toLowerCase();
    return genres.filter((genre) => genre.toLowerCase().includes(search));
  }, [inputValue]);

  const handleSelect = (selectedGenre: string) => {
    if (selectedGenre === value) {
      onValueChange(undefined);
    } else {
      onValueChange(selectedGenre);
    }
    setInputValue('');
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setInputValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          role='combobox'
          aria-expanded={open}
          aria-controls={listboxId}
          className={cn(
            // Match Input styling with max-width
            'border-foreground/10 flex h-9 max-w-[240px] items-center justify-between gap-2 rounded-sm border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow]',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none',
            'dark:bg-input/30',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className='truncate'>{value || placeholder}</span>
          <ChevronDownIcon className='text-muted-foreground size-4 shrink-0' />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className='bg-popover text-popover-foreground border-foreground/10 w-[--radix-popover-trigger-width] min-w-[240px] overflow-hidden rounded-sm border p-0 shadow-md'
        align='start'
        sideOffset={4}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <Command shouldFilter={false}>
          {/* Search input inside dropdown */}
          <div className='border-foreground/10 flex items-center gap-2 border-b px-3 py-2'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder='Search genres...'
              className='placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none'
            />
          </div>

          <CommandList id={listboxId} className='max-h-[300px] overflow-y-auto p-1'>
            {filteredGenres.length === 0 && (
              <div className='text-muted-foreground py-6 text-center text-sm'>No genre found.</div>
            )}
            <CommandGroup>
              {filteredGenres.map((genre) => (
                <CommandItem
                  key={genre}
                  value={genre}
                  onSelect={() => handleSelect(genre)}
                  className='relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none'
                >
                  {genre}
                  <span className='absolute right-2 flex size-3.5 items-center justify-center'>
                    {value === genre && <CheckIcon className='size-4' />}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
