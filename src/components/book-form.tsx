'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { BookCoverPicker } from '@/components/book-cover-picker';
import { DatePicker } from '@/components/date-picker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { GenreCombobox } from '@/components/genre-combobox';
import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_MAX_PAGE_COUNT,
  BOOK_MIN_PUBLISH_YEAR,
  BOOK_TITLE_MAX_LENGTH,
  bookFormSchema,
  getMaximumPublishYear,
  toBookInput,
  type BookFormValues,
  type BookCreateInput,
} from '@/lib/book-validation';
import {
  OWNERSHIP_TYPES,
  OWNERSHIP_TYPE_LABELS,
  READING_FORMATS,
  READING_FORMAT_LABELS,
  READING_STATUSES,
  READING_STATUS_LABELS,
  getToday,
  isTerminalReadingStatus,
  type ReadingStatus,
} from '@/lib/reading-lifecycle';

interface BookFormProps {
  defaultValues: BookFormValues;
  title: string;
  saying: string;
  actionLabel: string;
  pendingLabel: string;
  isPending: boolean;
  showReadingDetails?: boolean;
  onSubmit: (values: BookCreateInput) => void;
  onCancel: () => void;
}

export function BookForm({
  defaultValues,
  title,
  saying,
  actionLabel,
  pendingLabel,
  isPending,
  showReadingDetails = false,
  onSubmit,
  onCancel,
}: BookFormProps) {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues,
  });
  const titleValue = useWatch({ control: form.control, name: 'title' });
  const authorValue = useWatch({ control: form.control, name: 'author' });
  const selectedCoverId = useWatch({
    control: form.control,
    name: 'coverSourceId',
  });
  const includeReadingDetails = useWatch({
    control: form.control,
    name: 'includeReadingDetails',
  });
  const readingStatus = useWatch({ control: form.control, name: 'readingStatus' });

  const selectCover = (coverSourceId: string | null) => {
    form.setValue('coverSource', coverSourceId ? 'open_library' : null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('coverSourceId', coverSourceId, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(toBookInput(values)))}>
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle>
              <h1>{title}</h1>
            </CardTitle>
            <CardDescription>{saying}</CardDescription>
          </CardHeader>
          <CardContent className='flex min-w-0 flex-col gap-6'>
            <FormField
              control={form.control}
              name='title'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Jane Eyre'
                      maxLength={BOOK_TITLE_MAX_LENGTH}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='author'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Charlotte Brontë'
                      maxLength={BOOK_AUTHOR_MAX_LENGTH}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='numberOfPages'
                render={({ field, fieldState }) => (
                  <FormItem data-invalid={fieldState.invalid}>
                    <FormLabel>Pages</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        min={1}
                        max={BOOK_MAX_PAGE_COUNT}
                        placeholder='352'
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='publishYear'
                render={({ field, fieldState }) => (
                  <FormItem data-invalid={fieldState.invalid}>
                    <FormLabel>Publication Year</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        min={BOOK_MIN_PUBLISH_YEAR}
                        max={getMaximumPublishYear()}
                        placeholder='1847'
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='genre'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Genre</FormLabel>
                  <FormControl>
                    <GenreCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a genre'
                      className='w-60'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='ownershipType'
              render={({ field, fieldState }) => (
                <FormItem data-invalid={fieldState.invalid}>
                  <FormLabel>Ownership</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className='w-60 rounded-sm' aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {OWNERSHIP_TYPES.map((ownershipType) => (
                          <SelectItem key={ownershipType} value={ownershipType}>
                            {OWNERSHIP_TYPE_LABELS[ownershipType]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showReadingDetails && (
              <FormField
                control={form.control}
                name='includeReadingDetails'
                render={({ field }) => (
                  <FormItem className='flex items-center gap-3'>
                    <FormControl>
                      <Checkbox
                        id='include-reading-details'
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    </FormControl>
                    <FormLabel htmlFor='include-reading-details'>Add reading details</FormLabel>
                  </FormItem>
                )}
              />
            )}

            {showReadingDetails && includeReadingDetails && (
              <div className='border-foreground/10 flex flex-col gap-6 rounded-sm border p-4'>
                <FormField
                  control={form.control}
                  name='readingStatus'
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
                            form.setValue('endedOn', '', { shouldValidate: true });
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
                            {READING_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {READING_STATUS_LABELS[status]}
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
                  name='readingFormat'
                  render={({ field, fieldState }) => (
                    <FormItem data-invalid={fieldState.invalid}>
                      <FormLabel>Format</FormLabel>
                      <Select
                        value={field.value || 'unknown'}
                        onValueChange={(value) => field.onChange(value === 'unknown' ? '' : value)}
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

                <div className='grid gap-6 sm:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='startedOn'
                    render={({ field, fieldState }) => (
                      <FormItem data-invalid={fieldState.invalid}>
                        <FormLabel>Started</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onValueChange={(value) => field.onChange(value ?? '')}
                            max={getToday()}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            aria-invalid={fieldState.invalid}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isTerminalReadingStatus(readingStatus) && (
                    <FormField
                      control={form.control}
                      name='endedOn'
                      render={({ field, fieldState }) => (
                        <FormItem data-invalid={fieldState.invalid}>
                          <FormLabel>
                            {readingStatus === 'finished' ? 'Finished' : 'Stopped'}
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onValueChange={(value) => field.onChange(value ?? '')}
                              max={getToday()}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              aria-invalid={fieldState.invalid}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            <BookCoverPicker
              title={titleValue}
              author={authorValue}
              selectedCoverId={selectedCoverId ?? null}
              onSelectionChange={selectCover}
            />
          </CardContent>
          <CardFooter className='flex flex-col gap-3 sm:flex-row'>
            <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
              {isPending ? pendingLabel : actionLabel}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isPending}
              className='w-full sm:w-auto'
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
