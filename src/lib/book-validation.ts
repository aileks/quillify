import { z } from 'zod';

export const BOOK_TITLE_MAX_LENGTH = 200;
export const BOOK_AUTHOR_MAX_LENGTH = 120;
export const BOOK_GENRE_MAX_LENGTH = 80;
export const BOOK_MIN_PUBLISH_YEAR = 1000;
export const BOOK_MAX_PAGE_COUNT = 100_000;

export function getMaximumPublishYear(referenceDate = new Date()): number {
  return referenceDate.getFullYear() + 5;
}

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(BOOK_TITLE_MAX_LENGTH),
  author: z.string().trim().min(1, 'Author is required').max(BOOK_AUTHOR_MAX_LENGTH),
  numberOfPages: z.number().int().min(1).max(BOOK_MAX_PAGE_COUNT),
  genre: z.string().trim().max(BOOK_GENRE_MAX_LENGTH).optional(),
  publishYear: z.number().int().min(BOOK_MIN_PUBLISH_YEAR).max(getMaximumPublishYear()),
});

export const bookUpdateInputSchema = bookInputSchema.partial().extend({
  id: z.string().min(1),
});

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(BOOK_TITLE_MAX_LENGTH),
  author: z.string().trim().min(1, 'Author is required').max(BOOK_AUTHOR_MAX_LENGTH),
  numberOfPages: z
    .string()
    .trim()
    .min(1, 'Number of pages is required')
    .refine(
      (value) => {
        const pages = Number(value);
        return Number.isInteger(pages) && pages >= 1 && pages <= BOOK_MAX_PAGE_COUNT;
      },
      { message: `Pages must be between 1 and ${BOOK_MAX_PAGE_COUNT.toLocaleString()}` }
    ),
  publishYear: z
    .string()
    .trim()
    .min(1, 'Publication year is required')
    .refine(
      (value) => {
        const year = Number(value);
        return (
          Number.isInteger(year) && year >= BOOK_MIN_PUBLISH_YEAR && year <= getMaximumPublishYear()
        );
      },
      {
        message: `Year must be between ${BOOK_MIN_PUBLISH_YEAR} and ${getMaximumPublishYear()}`,
      }
    ),
  genre: z.string().trim().max(BOOK_GENRE_MAX_LENGTH).optional(),
});

export type BookInput = z.infer<typeof bookInputSchema>;
export type BookFormValues = z.infer<typeof bookFormSchema>;

export function toBookInput(values: BookFormValues): BookInput {
  return bookInputSchema.parse({
    title: values.title,
    author: values.author,
    numberOfPages: Number(values.numberOfPages),
    publishYear: Number(values.publishYear),
    genre: values.genre || 'Other',
  });
}
