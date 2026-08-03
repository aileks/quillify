import { describe, expect, it } from 'vitest';

import {
  normalizeOpenLibrarySearchResponse,
  searchOpenLibrary,
} from '@/server/services/book-metadata/open-library';

describe('Open Library metadata service', () => {
  it('normalizes the selected edition and ignores results without covers', () => {
    const results = normalizeOpenLibrarySearchResponse(
      {
        docs: [
          {
            key: '/works/OL123W',
            title: 'Jane Eyre',
            author_name: ['Charlotte Brontë'],
            first_publish_year: 1847,
            cover_i: 111,
            isbn: ['work-isbn'],
            editions: {
              docs: [
                {
                  key: '/books/OL456M',
                  title: 'Jane Eyre',
                  cover_i: 222,
                  publish_date: ['2006'],
                  isbn: ['9780141441146', '0141441143'],
                },
              ],
            },
          },
          {
            key: '/works/OL789W',
            title: 'Jane Eyre Study Guide',
            author_name: ['Someone Else'],
          },
        ],
      },
      { title: 'Jane Eyre', author: 'Charlotte Bronte' }
    );

    expect(results).toEqual([
      {
        openLibraryId: 'OL456M',
        coverId: '222',
        title: 'Jane Eyre',
        authors: ['Charlotte Brontë'],
        firstPublicationYear: 1847,
        editionPublicationYear: 2006,
        isbns: ['9780141441146', '0141441143'],
        coverPreviewUrl: 'https://covers.openlibrary.org/b/id/222-M.jpg',
      },
    ]);
  });

  it('ranks exact title and author matches above weak matches', () => {
    const results = normalizeOpenLibrarySearchResponse(
      {
        docs: [
          {
            key: '/works/OL1W',
            title: 'Jane Eyre Study Guide',
            author_name: ['Study Notes Press'],
            cover_i: 1,
          },
          {
            key: '/works/OL2W',
            title: 'Jäne Eyre',
            author_name: ['Charlotte Brontë'],
            cover_i: 2,
          },
          {
            key: '/works/OL3W',
            title: 'Jane Air',
            author_name: ['Charlotte Bronte'],
            cover_i: 3,
          },
        ],
      },
      { title: 'Jane Eyre', author: 'Charlotte Bronte' }
    );

    expect(results.map(({ coverId }) => coverId)).toEqual(['2', '3', '1']);
  });

  it('returns an empty list when no results have covers', () => {
    expect(
      normalizeOpenLibrarySearchResponse(
        {
          docs: [
            {
              key: '/works/OL1W',
              title: 'A Book',
            },
          ],
        },
        { title: 'A Book' }
      )
    ).toEqual([]);
  });

  it('returns up to 15 distinct cover choices', () => {
    const results = normalizeOpenLibrarySearchResponse(
      {
        docs: Array.from({ length: 18 }, (_, index) => ({
          key: `/works/OL${index}W`,
          title: `The Hobbit edition ${index}`,
          author_name: ['J.R.R. Tolkien'],
          cover_i: index + 1,
        })),
      },
      { title: 'The Hobbit', author: 'J.R.R. Tolkien' }
    );

    expect(results).toHaveLength(15);
    expect(new Set(results.map(({ coverId }) => coverId))).toHaveProperty('size', 15);
  });

  it('uses relevance matching for title and author', async () => {
    let requestUrl: URL | undefined;
    let requestInit: RequestInit | undefined;

    await searchOpenLibrary(
      { title: 'Jane Eyre', author: 'Charlotte Bronte' },
      {
        fetchImplementation: async (input, init) => {
          requestUrl = new URL(input.toString());
          requestInit = init;
          return Response.json({ docs: [] });
        },
      }
    );

    expect(requestUrl?.searchParams.get('q')).toBe('Jane Eyre Charlotte Bronte');
    expect(requestUrl?.searchParams.get('limit')).toBe('15');
    expect(requestUrl?.searchParams.has('title')).toBe(false);
    expect(requestUrl?.searchParams.has('author')).toBe(false);
    expect(requestInit?.next?.revalidate).toBe(24 * 60 * 60);
  });

  it('searches by title without an author', async () => {
    let requestUrl: URL | undefined;

    await searchOpenLibrary(
      { title: 'Jane Eyre' },
      {
        fetchImplementation: async (input) => {
          requestUrl = new URL(input.toString());
          return Response.json({ docs: [] });
        },
      }
    );

    expect(requestUrl?.searchParams.get('q')).toBe('Jane Eyre');
  });

  it('reports third-party HTTP failures', async () => {
    await expect(
      searchOpenLibrary(
        { title: 'Jane Eyre', author: 'Charlotte Bronte' },
        {
          fetchImplementation: async () =>
            new Response(null, { status: 503, statusText: 'Unavailable' }),
        }
      )
    ).rejects.toMatchObject({
      code: 'unavailable',
    });
  });

  it('reports timeouts', async () => {
    const fetchImplementation = (_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

    await expect(
      searchOpenLibrary(
        { title: 'Jane Eyre' },
        {
          fetchImplementation,
          timeoutMs: 1,
        }
      )
    ).rejects.toMatchObject({
      code: 'timeout',
    });
  });

  it('reports malformed responses', async () => {
    await expect(
      searchOpenLibrary(
        { title: 'Jane Eyre' },
        {
          fetchImplementation: async () =>
            new Response(JSON.stringify({ results: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
        }
      )
    ).rejects.toMatchObject({
      code: 'malformed_response',
    });
  });
});
