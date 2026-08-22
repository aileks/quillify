import { z } from 'zod';

import {
  getOpenLibraryCoverUrl,
  type OpenLibraryCatalogSearchResult,
  type OpenLibrarySearchResult,
} from '@/lib/open-library';

const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_SEARCH_LIMIT = 15;
export const OPEN_LIBRARY_RESULT_LIMIT = 15;
export const OPEN_LIBRARY_TIMEOUT_MS = 5_000;

const publicationDateSchema = z.union([z.string(), z.array(z.string())]).optional();

const editionSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1).optional(),
  cover_i: z.number().int().positive().optional(),
  publish_date: publicationDateSchema,
  isbn: z.array(z.string()).optional(),
  number_of_pages: z.number().int().positive().optional(),
});

const searchDocumentSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  author_name: z.array(z.string()).optional(),
  first_publish_year: z.number().int().optional(),
  cover_i: z.number().int().positive().optional(),
  cover_edition_key: z.string().min(1).optional(),
  isbn: z.array(z.string()).optional(),
  number_of_pages_median: z.number().int().positive().optional(),
  editions: z
    .object({
      docs: z.array(z.unknown()),
    })
    .optional(),
});

const searchResponseSchema = z.object({
  docs: z.array(z.unknown()),
});

export interface OpenLibrarySearchInput {
  title: string;
  author?: string;
}

export interface OpenLibraryCatalogSearchInput {
  query: string;
}

type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export class OpenLibraryServiceError extends Error {
  constructor(
    public readonly code: 'timeout' | 'unavailable' | 'malformed_response',
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'OpenLibraryServiceError';
  }
}

function normalizeOpenLibraryId(key: string): string {
  return key.split('/').filter(Boolean).at(-1) ?? key;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getBigrams(value: string): Set<string> {
  const compactValue = value.replace(/\s/g, '');
  const bigrams = new Set<string>();

  for (let index = 0; index < compactValue.length - 1; index += 1) {
    bigrams.add(compactValue.slice(index, index + 2));
  }

  return bigrams;
}

function getTextSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) {
    return 0;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  if (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) {
    return 0.9;
  }

  const leftBigrams = getBigrams(normalizedLeft);
  const rightBigrams = getBigrams(normalizedRight);

  if (leftBigrams.size === 0 || rightBigrams.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const bigram of leftBigrams) {
    if (rightBigrams.has(bigram)) {
      overlap += 1;
    }
  }

  return (2 * overlap) / (leftBigrams.size + rightBigrams.size);
}

function parsePublicationYear(publicationDate: string | string[] | undefined): number | null {
  const values =
    Array.isArray(publicationDate) ? publicationDate
    : publicationDate === undefined ? []
    : [publicationDate];

  for (const value of values) {
    const matchedYear = value.match(/\b\d{4}\b/)?.[0];
    if (!matchedYear) {
      continue;
    }

    const year = Number(matchedYear);
    if (year >= 1000 && year <= new Date().getFullYear() + 5) {
      return year;
    }
  }

  return null;
}

function normalizeIsbns(isbns: string[] | undefined): string[] {
  return Array.from(
    new Set((isbns ?? []).map((isbn) => isbn.trim()).filter((isbn) => isbn.length > 0))
  ).slice(0, 10);
}

function getSearchResultScore(
  result: OpenLibrarySearchResult,
  input: OpenLibrarySearchInput
): number {
  const titleSimilarity = getTextSimilarity(result.title, input.title);
  const authorSimilarity =
    input.author ?
      Math.max(0, ...result.authors.map((author) => getTextSimilarity(author, input.author!)))
    : 0;

  return titleSimilarity * 100 + authorSimilarity * 60;
}

/** Unvalidated JSON body of an Open Library search response; docs are parsed per document. */
export interface OpenLibrarySearchEnvelope {
  docs?: unknown;
}

export function normalizeOpenLibrarySearchResponse(
  response: OpenLibrarySearchEnvelope,
  input: OpenLibrarySearchInput
): OpenLibrarySearchResult[] {
  const parsedResponse = searchResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    throw new OpenLibraryServiceError(
      'malformed_response',
      'Open Library returned an unexpected response',
      { cause: parsedResponse.error }
    );
  }

  const results: Array<OpenLibrarySearchResult & { sourceIndex: number }> = [];

  parsedResponse.data.docs.forEach((rawDocument, sourceIndex) => {
    const parsedDocument = searchDocumentSchema.safeParse(rawDocument);
    if (!parsedDocument.success) {
      return;
    }

    const document = parsedDocument.data;
    const parsedEdition = editionSchema.safeParse(document.editions?.docs[0]);
    const edition = parsedEdition.success ? parsedEdition.data : null;
    const coverId = edition?.cover_i ?? document.cover_i;

    if (!coverId) {
      return;
    }

    const openLibraryEditionId = normalizeOpenLibraryId(
      edition?.key ?? document.cover_edition_key ?? ''
    );
    const isbns = normalizeIsbns(edition?.isbn);

    results.push({
      openLibraryWorkId: normalizeOpenLibraryId(document.key),
      openLibraryEditionId: openLibraryEditionId || null,
      coverId: String(coverId),
      title: edition?.title ?? document.title,
      authors: (document.author_name ?? []).map((author) => author.trim()).filter(Boolean),
      firstPublicationYear: document.first_publish_year ?? null,
      editionPublicationYear: parsePublicationYear(edition?.publish_date),
      isbns,
      coverPreviewUrl: getOpenLibraryCoverUrl(String(coverId)),
      sourceIndex,
    });
  });

  return results
    .sort((left, right) => {
      const scoreDifference =
        getSearchResultScore(right, input) - getSearchResultScore(left, input);
      return scoreDifference || left.sourceIndex - right.sourceIndex;
    })
    .filter(
      (result, index, allResults) =>
        allResults.findIndex((candidate) => candidate.coverId === result.coverId) === index
    )
    .slice(0, OPEN_LIBRARY_RESULT_LIMIT)
    .map((result) => ({
      openLibraryWorkId: result.openLibraryWorkId,
      openLibraryEditionId: result.openLibraryEditionId,
      coverId: result.coverId,
      title: result.title,
      authors: result.authors,
      firstPublicationYear: result.firstPublicationYear,
      editionPublicationYear: result.editionPublicationYear,
      isbns: result.isbns,
      coverPreviewUrl: result.coverPreviewUrl,
    }));
}

export function normalizeOpenLibraryCatalogSearchResponse(
  response: OpenLibrarySearchEnvelope
): OpenLibraryCatalogSearchResult[] {
  const parsedResponse = searchResponseSchema.safeParse(response);
  if (!parsedResponse.success) {
    throw new OpenLibraryServiceError(
      'malformed_response',
      'Open Library returned an unexpected response',
      { cause: parsedResponse.error }
    );
  }

  const results: OpenLibraryCatalogSearchResult[] = [];

  for (const rawDocument of parsedResponse.data.docs) {
    const parsedDocument = searchDocumentSchema.safeParse(rawDocument);
    if (!parsedDocument.success) {
      continue;
    }

    const document = parsedDocument.data;
    const parsedEdition = editionSchema.safeParse(document.editions?.docs[0]);
    const edition = parsedEdition.success ? parsedEdition.data : null;
    const coverId = edition?.cover_i ?? document.cover_i;

    results.push({
      openLibraryWorkId: normalizeOpenLibraryId(document.key),
      openLibraryEditionId:
        edition?.key || document.cover_edition_key ?
          normalizeOpenLibraryId(edition?.key ?? document.cover_edition_key ?? '')
        : null,
      coverId: coverId ? String(coverId) : null,
      title: edition?.title ?? document.title,
      authors: (document.author_name ?? []).map((author) => author.trim()).filter(Boolean),
      firstPublicationYear: document.first_publish_year ?? null,
      editionPublicationYear: parsePublicationYear(edition?.publish_date),
      numberOfPages: edition?.number_of_pages ?? document.number_of_pages_median ?? null,
      isbns: normalizeIsbns(edition?.isbn ?? document.isbn),
    });
  }

  return results
    .filter(
      (result, index, allResults) =>
        allResults.findIndex(
          (candidate) =>
            (candidate.openLibraryEditionId ?? candidate.openLibraryWorkId) ===
            (result.openLibraryEditionId ?? result.openLibraryWorkId)
        ) === index
    )
    .slice(0, OPEN_LIBRARY_RESULT_LIMIT);
}

function getCatalogQuery(query: string): string {
  const trimmedQuery = query.trim();
  const compactQuery = trimmedQuery.replace(/[\s-]/g, '').toUpperCase();

  if (/^(?:\d{9}[\dX]|\d{13})$/.test(compactQuery)) {
    return `isbn:${compactQuery}`;
  }

  return trimmedQuery;
}

async function fetchOpenLibrarySearch(
  query: string,
  fields: string[],
  options: {
    fetchImplementation?: FetchImplementation;
    timeoutMs?: number;
  }
): Promise<OpenLibrarySearchEnvelope> {
  const searchUrl = new URL(OPEN_LIBRARY_SEARCH_URL);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('limit', String(OPEN_LIBRARY_SEARCH_LIMIT));
  searchUrl.searchParams.set('fields', fields.join(','));

  const fetchImplementation = options.fetchImplementation ?? fetch;
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    options.timeoutMs ?? OPEN_LIBRARY_TIMEOUT_MS
  );

  try {
    const response = await fetchImplementation(searchUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Quillify book metadata search',
      },
      next: {
        revalidate: 24 * 60 * 60,
      },
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new OpenLibraryServiceError(
        'unavailable',
        `Open Library request failed with status ${response.status}`
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new OpenLibraryServiceError(
        'malformed_response',
        'Open Library returned invalid JSON',
        { cause: error }
      );
    }
  } catch (error) {
    if (error instanceof OpenLibraryServiceError) {
      throw error;
    }

    if (abortController.signal.aborted) {
      throw new OpenLibraryServiceError('timeout', 'Open Library request timed out', {
        cause: error,
      });
    }

    throw new OpenLibraryServiceError('unavailable', 'Open Library request failed', {
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchOpenLibrary(
  input: OpenLibrarySearchInput,
  options: {
    fetchImplementation?: FetchImplementation;
    timeoutMs?: number;
  } = {}
): Promise<OpenLibrarySearchResult[]> {
  const response = await fetchOpenLibrarySearch(
    [input.title, input.author].filter(Boolean).join(' '),
    [
      'key',
      'title',
      'author_name',
      'first_publish_year',
      'cover_i',
      'cover_edition_key',
      'editions',
      'editions.key',
      'editions.title',
      'editions.publish_date',
      'editions.cover_i',
      'editions.isbn',
    ],
    options
  );

  return normalizeOpenLibrarySearchResponse(response, input);
}

export async function searchOpenLibraryCatalog(
  input: OpenLibraryCatalogSearchInput,
  options: {
    fetchImplementation?: FetchImplementation;
    timeoutMs?: number;
  } = {}
): Promise<OpenLibraryCatalogSearchResult[]> {
  const response = await fetchOpenLibrarySearch(
    getCatalogQuery(input.query),
    [
      'key',
      'title',
      'author_name',
      'first_publish_year',
      'cover_i',
      'cover_edition_key',
      'isbn',
      'number_of_pages_median',
      'editions',
      'editions.key',
      'editions.title',
      'editions.publish_date',
      'editions.cover_i',
      'editions.isbn',
      'editions.number_of_pages',
    ],
    options
  );

  return normalizeOpenLibraryCatalogSearchResponse(response);
}
