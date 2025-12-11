'use client';

import * as React from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
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

  // Filter genres based on input, but only when user is typing
  const filteredGenres = React.useMemo(() => {
    if (!inputValue) return genres;
    const search = inputValue.toLowerCase();
    return genres.filter((genre) => genre.toLowerCase().includes(search));
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!open) setOpen(true);
  };

  const handleSelect = (selectedGenre: string) => {
    if (selectedGenre === value) {
      onValueChange(undefined);
    } else {
      onValueChange(selectedGenre);
    }
    setInputValue('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputValue('');
      setOpen(false);
      inputRef.current?.blur();
    }
    // Open dropdown on arrow down
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on item to register
    setTimeout(() => {
      setOpen(false);
      setInputValue('');
    }, 150);
  };

  // Display value: show input when typing, otherwise show selected value or placeholder
  const displayValue = inputValue || value || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Command shouldFilter={false} className='overflow-visible bg-transparent'>
        <PopoverAnchor asChild>
          <div
            className={cn(
              // Match Input styling, but with max-width for narrower appearance
              'border-foreground/10 flex h-9 max-w-[200px] items-center rounded-sm border bg-transparent shadow-xs transition-[color,box-shadow]',
              'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
              'dark:bg-input/30',
              className
            )}
          >
            <SearchIcon className='text-muted-foreground ml-3 size-4 shrink-0' />
            <CommandPrimitive.Input
              ref={inputRef}
              value={displayValue}
              onChangeCapture={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={cn(
                'placeholder:text-muted-foreground h-full w-full flex-1 bg-transparent px-2 py-1 text-base outline-none md:text-sm',
                !inputValue && !value && 'text-muted-foreground'
              )}
            />
            <ChevronDownIcon className='text-muted-foreground mr-3 size-4 shrink-0' />
          </div>
        </PopoverAnchor>

        {open && (
          <PopoverContent
            className='bg-popover text-popover-foreground border-foreground/10 w-[--radix-popover-trigger-width] min-w-[200px] overflow-hidden rounded-sm border p-0 shadow-md'
            align='start'
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <CommandList className='max-h-[300px] overflow-y-auto p-1'>
              {filteredGenres.length === 0 && (
                <div className='text-muted-foreground py-6 text-center text-sm'>
                  No genre found.
                </div>
              )}
              <CommandGroup>
                {filteredGenres.map((genre) => (
                  <CommandItem
                    key={genre}
                    value={genre}
                    onMouseDown={(e) => e.preventDefault()}
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
          </PopoverContent>
        )}
      </Command>
    </Popover>
  );
}
