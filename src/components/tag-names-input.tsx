'use client';

import * as React from 'react';
import { XIcon } from 'lucide-react';

import { BOOK_TAGS_MAX_COUNT, TAG_NAME_MAX_LENGTH, normalizeTagNames } from '@/lib/organization';
import { cn } from '@/lib/utils';

interface TagNamesInputProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  className?: string;
  id?: string;
}

export function TagNamesInput({
  value,
  onValueChange,
  suggestions = [],
  placeholder = 'Add a tag',
  ariaLabel = 'Tags',
  ariaInvalid = false,
  className,
  id,
}: TagNamesInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const commit = (raw: string) => {
    const name = raw.trim().slice(0, TAG_NAME_MAX_LENGTH);
    setInputValue('');

    if (!name) return;
    if (value.some((tag) => tag.toLowerCase() === name.toLowerCase())) return;
    if (value.length >= BOOK_TAGS_MAX_COUNT) return;

    onValueChange(normalizeTagNames([...value, name]));
  };

  const matches = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    const selected = new Set(value.map((tag) => tag.toLowerCase()));
    return suggestions
      .filter((tag) => tag.toLowerCase().includes(query) && !selected.has(tag.toLowerCase()))
      .slice(0, 6);
  }, [inputValue, suggestions, value]);

  React.useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div
        className='border-input focus-within:border-ring focus-within:ring-ring/50 dark:bg-input/30 flex min-h-9 flex-wrap items-center gap-1.5 rounded-sm border px-3 py-1 shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]'
        data-invalid={ariaInvalid || undefined}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs'
          >
            {tag}
            <button
              type='button'
              onClick={() => onValueChange(value.filter((item) => item !== tag))}
              className='hover:text-destructive -mr-0.5 rounded-sm p-0.5'
              aria-label={`Remove tag ${tag}`}
            >
              <XIcon className='size-3' />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit(inputValue);
            } else if (event.key === 'Backspace' && !inputValue && value.length > 0) {
              onValueChange(value.slice(0, -1));
            }
          }}
          onFocus={() => setIsFocused(true)}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          maxLength={TAG_NAME_MAX_LENGTH}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={value.length >= BOOK_TAGS_MAX_COUNT}
          className='placeholder:text-muted-foreground min-w-[80px] flex-1 bg-transparent text-sm outline-none'
        />
      </div>

      {isFocused && matches.length > 0 && (
        <ul
          role='listbox'
          aria-label='Tag suggestions'
          className='bg-popover text-popover-foreground border-foreground/10 absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-sm border p-1 shadow-md'
        >
          {matches.map((tag) => (
            <li key={tag}>
              <button
                type='button'
                role='option'
                aria-selected={false}
                onClick={() => {
                  commit(tag);
                  inputRef.current?.focus();
                }}
                className='hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm'
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
