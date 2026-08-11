'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const calendarStartMonth = new Date(1900, 0, 1);

type DatePickerProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onChange' | 'type' | 'value'
> & {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  max?: string;
  placeholder?: string;
};

function parseCalendarDate(value?: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }

  return date;
}

function toCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onValueChange,
  max,
  placeholder = 'Pick a date',
  className,
  ref,
  ...triggerProps
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseCalendarDate(value);
  const maximumDate = parseCalendarDate(max);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type='button'
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            selectedDate ? undefined : 'text-muted-foreground',
            className
          )}
          {...triggerProps}
        >
          <CalendarIcon data-icon='inline-start' />
          {selectedDate ? format(selectedDate, 'MM/dd/yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          required
          selected={selectedDate}
          defaultMonth={selectedDate ?? maximumDate}
          onSelect={(date) => {
            onValueChange(toCalendarDate(date));
            setOpen(false);
          }}
          disabled={maximumDate ? { after: maximumDate } : undefined}
          captionLayout='dropdown'
          startMonth={calendarStartMonth}
          endMonth={maximumDate}
        />
        {selectedDate ?
          <div className='px-3 pb-3'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='w-full'
              onClick={() => {
                onValueChange(null);
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        : null}
      </PopoverContent>
    </Popover>
  );
}
