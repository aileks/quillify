import { describe, expect, it } from 'vitest';

import {
  canTransitionReadingStatus,
  getAllowedReadingStatuses,
  readingPeriodFieldsSchema,
} from '@/lib/reading-lifecycle';

describe('reading lifecycle', () => {
  it('allows guided active-reading transitions', () => {
    expect(getAllowedReadingStatuses('to_read')).toEqual(['reading', 'finished']);
    expect(getAllowedReadingStatuses('reading')).toEqual(['paused', 'finished', 'did_not_finish']);
    expect(canTransitionReadingStatus('paused', 'reading')).toBe(true);
    expect(canTransitionReadingStatus('to_read', 'paused')).toBe(false);
  });

  it('starts a new period after a terminal status', () => {
    expect(getAllowedReadingStatuses('finished')).toEqual(['to_read', 'reading']);
    expect(getAllowedReadingStatuses('did_not_finish')).toEqual(['to_read', 'reading']);
  });

  it('rejects invalid date ranges and active end dates', () => {
    expect(
      readingPeriodFieldsSchema.safeParse({
        status: 'finished',
        format: 'print',
        startedOn: '2026-08-10',
        endedOn: '2026-08-09',
      }).success
    ).toBe(false);
    expect(
      readingPeriodFieldsSchema.safeParse({
        status: 'reading',
        format: null,
        startedOn: null,
        endedOn: '2026-08-10',
      }).success
    ).toBe(false);
  });
});
