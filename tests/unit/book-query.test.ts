import { describe, expect, it } from 'vitest';

import { parseBookQueryParams, parseBookQueryRecord } from '@/lib/book-query';

describe('reading-list query state', () => {
  it('falls back from invalid URL parameters', () => {
    const params = new URLSearchParams(
      'page=-4&sortBy=unknown&sortOrder=sideways&isRead=maybe&genre=Fiction,History'
    );

    expect(parseBookQueryParams(params)).toEqual({
      page: 1,
      search: '',
      genre: ['Fiction', 'History'],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: undefined,
    });
  });

  it('maps legacy read filters when status is absent', () => {
    expect(parseBookQueryParams(new URLSearchParams('isRead=true')).status).toBe('finished');
    expect(parseBookQueryParams(new URLSearchParams('isRead=false')).status).toBe('to_read');
  });

  it('parses Next.js search parameter records with the same defaults', () => {
    expect(
      parseBookQueryRecord({
        search: 'dune',
        genre: ['Science Fiction', 'ignored'],
        page: '2',
      })
    ).toEqual({
      page: 2,
      search: 'dune',
      genre: ['Science Fiction'],
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: undefined,
    });
  });
});
