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
      status: undefined,
    });
  });

  it('maps legacy read filters when status is absent', () => {
    expect(parseBookQueryParams(new URLSearchParams('isRead=true')).status).toBe('finished');
    expect(parseBookQueryParams(new URLSearchParams('isRead=false')).status).toBe('to_read');
  });
});
