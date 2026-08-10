import {
  BOOK_MAX_PAGE_COUNT,
  BOOK_MIN_PUBLISH_YEAR,
  getMaximumPublishYear,
  type BookFormValues,
} from '@/lib/book-validation';
import type { OpenLibraryCatalogSearchResult } from '@/lib/open-library';

export function catalogResultToBookFormValues(
  result: OpenLibraryCatalogSearchResult
): BookFormValues {
  const publicationYear = result.editionPublicationYear ?? result.firstPublicationYear;
  const hasValidPublicationYear =
    publicationYear !== null &&
    publicationYear >= BOOK_MIN_PUBLISH_YEAR &&
    publicationYear <= getMaximumPublishYear();
  const hasValidPageCount =
    result.numberOfPages !== null && result.numberOfPages <= BOOK_MAX_PAGE_COUNT;

  return {
    title: result.title,
    author: result.authors.join(', '),
    numberOfPages: hasValidPageCount ? String(result.numberOfPages) : '',
    publishYear: hasValidPublicationYear ? String(publicationYear) : '',
    genre: '',
    coverSource: result.coverId ? 'open_library' : null,
    coverSourceId: result.coverId,
  };
}
