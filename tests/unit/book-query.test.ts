import { describe, expect, it } from 'vitest';

import { parseBookQueryParams } from '@/lib/book-query';

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
      isRead: undefined,
    });
  });
});
