export type DuplicateMatchReason = 'same_edition' | 'same_book';

export interface DuplicateBookCandidate {
  id: string;
  title: string;
  author: string;
  publishYear: number;
  coverSourceId: string | null;
  isbn13: string | null;
  openLibraryEditionId: string | null;
}

export interface DuplicateBookIdentity {
  title: string;
  author: string;
  publishYear: number;
  isbn13?: string | null;
  openLibraryEditionId?: string | null;
}

export interface DuplicateBookMatch extends DuplicateBookCandidate {
  reason: DuplicateMatchReason;
}

export function normalizeDuplicateText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function classifyDuplicateCandidate(
  candidate: DuplicateBookCandidate,
  identity: DuplicateBookIdentity
): DuplicateBookMatch | null {
  const hasSameEdition =
    (identity.openLibraryEditionId !== null &&
      identity.openLibraryEditionId !== undefined &&
      candidate.openLibraryEditionId === identity.openLibraryEditionId) ||
    (identity.isbn13 !== null &&
      identity.isbn13 !== undefined &&
      candidate.isbn13 === identity.isbn13);

  if (hasSameEdition) {
    return { ...candidate, reason: 'same_edition' };
  }

  const hasSameBookMetadata =
    candidate.publishYear === identity.publishYear &&
    normalizeDuplicateText(candidate.title) === normalizeDuplicateText(identity.title) &&
    normalizeDuplicateText(candidate.author) === normalizeDuplicateText(identity.author);

  return hasSameBookMetadata ? { ...candidate, reason: 'same_book' } : null;
}
