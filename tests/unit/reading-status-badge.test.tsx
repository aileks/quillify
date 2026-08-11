import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ReadingStatusBadge } from '@/components/reading-status-badge';

const statusCases = [
  ['to_read', 'To Read', 'bg-status-to-read', 'text-status-to-read-foreground'],
  ['reading', 'Reading', 'bg-status-reading', 'text-status-reading-foreground'],
  ['paused', 'Paused', 'bg-status-paused', 'text-status-paused-foreground'],
  ['finished', 'Finished', 'bg-status-finished', 'text-status-finished-foreground'],
  [
    'did_not_finish',
    'Did Not Finish',
    'bg-status-did-not-finish',
    'text-status-did-not-finish-foreground',
  ],
] as const;

describe('ReadingStatusBadge', () => {
  it.each(statusCases)(
    'renders %s with its semantic status colors',
    (status, label, backgroundClass, foregroundClass) => {
      const markup = renderToStaticMarkup(createElement(ReadingStatusBadge, { status }));

      expect(markup).toContain(`data-reading-status="${status}"`);
      expect(markup).toContain(`>${label}</span>`);
      expect(markup).toContain(backgroundClass);
      expect(markup).toContain(foregroundClass);
    }
  );
});
