import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', async () => {
  const react = await import('react');

  return {
    default: (imageProps: { fill?: boolean; onError?: () => void; [key: string]: unknown }) => {
      const { fill, onError, ...props } = imageProps;
      void fill;
      void onError;
      return react.createElement('img', props);
    },
  };
});

import { BookCover } from '@/components/book-cover';

describe('BookCover', () => {
  it('renders an Open Library cover with useful alt text', () => {
    const markup = renderToStaticMarkup(
      createElement(BookCover, {
        coverSourceId: '12345',
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
      })
    );

    expect(markup).toContain('covers.openlibrary.org/b/id/12345-M.jpg?default=false');
    expect(markup).toContain('alt="Cover of Jane Eyre by Charlotte Brontë"');
    expect(markup).toContain('data-testid="book-cover-image"');
  });

  it('renders the literary fallback when no cover is selected', () => {
    const markup = renderToStaticMarkup(
      createElement(BookCover, {
        coverSourceId: null,
        title: 'Jane Eyre',
        author: 'Charlotte Brontë',
      })
    );

    expect(markup).toContain('data-testid="book-cover-placeholder"');
    expect(markup).toContain('Jane Eyre');
    expect(markup).toContain('Charlotte Brontë');
    expect(markup).not.toContain('<img');
  });
});
