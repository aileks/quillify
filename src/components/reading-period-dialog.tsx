'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  READING_FORMATS,
  READING_FORMAT_LABELS,
  READING_STATUS_LABELS,
  getToday,
  isTerminalReadingStatus,
  readingPeriodFieldsSchema,
  type ReadingPeriodFields,
  type ReadingStatus,
} from '@/lib/reading-lifecycle';

interface ReadingPeriodDialogProps {
  title: string;
  description: string;
  submitLabel: string;
  statuses: ReadingStatus[];
  defaultValues: ReadingPeriodFields;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ReadingPeriodFields) => void;
}

export function ReadingPeriodDialog({
  title,
  description,
  submitLabel,
  statuses,
  defaultValues,
  isPending,
  onClose,
  onSubmit,
}: ReadingPeriodDialogProps) {
  const form = useForm<ReadingPeriodFields>({
    resolver: zodResolver(readingPeriodFieldsSchema),
    defaultValues,
  });
  const status = useWatch({ control: form.control, name: 'status' });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className='flex flex-col gap-5' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='status'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value: ReadingStatus) => {
                      field.onChange(value);
                      const today = getToday();
                      if (value === 'reading' && !form.getValues('startedOn')) {
                        form.setValue('startedOn', today, { shouldValidate: true });
                      }
                      if (isTerminalReadingStatus(value) && !form.getValues('endedOn')) {
                        form.setValue('endedOn', today, { shouldValidate: true });
                      }
                      if (!isTerminalReadingStatus(value)) {
                        form.setValue('endedOn', null, { shouldValidate: true });
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger
                        className='w-full rounded-sm'
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {statuses.map((readingStatus) => (
                          <SelectItem key={readingStatus} value={readingStatus}>
                            {READING_STATUS_LABELS[readingStatus]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='format'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Format</FormLabel>
                  <Select
                    value={field.value ?? 'unknown'}
                    onValueChange={(value) => field.onChange(value === 'unknown' ? null : value)}
                  >
                    <FormControl>
                      <SelectTrigger
                        className='w-full rounded-sm'
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value='unknown'>Unknown</SelectItem>
                        {READING_FORMATS.map((format) => (
                          <SelectItem key={format} value={format}>
                            {READING_FORMAT_LABELS[format]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid gap-5 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='startedOn'
                render={({ field, fieldState }) => (
                  <FormItem data-invalid={fieldState.invalid}>
                    <FormLabel>Started</FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        max={getToday()}
                        aria-invalid={fieldState.invalid}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isTerminalReadingStatus(status) && (
                <FormField
                  control={form.control}
                  name='endedOn'
                  render={({ field, fieldState }) => (
                    <FormItem data-invalid={fieldState.invalid}>
                      <FormLabel>{status === 'finished' ? 'Finished' : 'Stopped'}</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          max={getToday()}
                          aria-invalid={fieldState.invalid}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Saving...' : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
