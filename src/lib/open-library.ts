const OPEN_LIBRARY_COVERS_URL = 'https://covers.openlibrary.org/b/id';

export interface OpenLibrarySearchResult {
  openLibraryWorkId: string;
  openLibraryEditionId: string | null;
  coverId: string;
  title: string;
  authors: string[];
  firstPublicationYear: number | null;
  editionPublicationYear: number | null;
  isbns: string[];
  coverPreviewUrl: string;
}

export interface OpenLibraryCatalogSearchResult {
  openLibraryWorkId: string;
  openLibraryEditionId: string | null;
  coverId: string | null;
  title: string;
  authors: string[];
  firstPublicationYear: number | null;
  editionPublicationYear: number | null;
  numberOfPages: number | null;
  isbns: string[];
}

export function getOpenLibraryCoverUrl(coverId: string, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${OPEN_LIBRARY_COVERS_URL}/${encodeURIComponent(coverId)}-${size}.jpg`;
}
