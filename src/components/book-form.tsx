'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
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
  type BookInput,
} from '@/lib/book-validation';

interface BookFormProps {
  defaultValues: BookFormValues;
  title: string;
  description?: string;
  actionLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onSubmit: (values: BookInput) => void;
  onCancel: () => void;
}

export function BookForm({
  defaultValues,
  title,
  description,
  actionLabel,
  pendingLabel,
  isPending,
  onSubmit,
  onCancel,
}: BookFormProps) {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(toBookInput(values)))}>
        <Card className='rounded-sm'>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className='flex flex-col gap-6'>
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
