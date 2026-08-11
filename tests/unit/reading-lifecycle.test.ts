import { describe, expect, it } from 'vitest';

import {
  getReadingDatesAfterStatusChange,
  readingPeriodFieldsSchema,
  startsNewReadingPeriod,
} from '@/lib/reading-lifecycle';

describe('reading lifecycle', () => {
  it('starts a new period only when a completed period becomes active', () => {
    expect(startsNewReadingPeriod('finished', 'to_read')).toBe(true);
    expect(startsNewReadingPeriod('did_not_finish', 'paused')).toBe(true);
    expect(startsNewReadingPeriod('finished', 'did_not_finish')).toBe(false);
    expect(startsNewReadingPeriod('to_read', 'paused')).toBe(false);
  });

  it('normalizes dates when a status changes', () => {
    const referenceDate = new Date(2026, 7, 11);

    expect(
      getReadingDatesAfterStatusChange(
        'finished',
        'reading',
        '2026-07-01',
        '2026-07-20',
        referenceDate
      )
    ).toEqual({ startedOn: '2026-08-11', endedOn: null });
    expect(
      getReadingDatesAfterStatusChange('reading', 'to_read', '2026-08-01', null, referenceDate)
    ).toEqual({ startedOn: null, endedOn: null });
    expect(
      getReadingDatesAfterStatusChange(
        'reading',
        'did_not_finish',
        '2026-08-01',
        null,
        referenceDate
      )
    ).toEqual({ startedOn: '2026-08-01', endedOn: '2026-08-11' });
  });

  it('rejects invalid date ranges and active end dates', () => {
    expect(
      readingPeriodFieldsSchema.safeParse({
        status: 'finished',
        format: 'print',
        startedOn: '2025-02-30',
        endedOn: null,
      }).success
    ).toBe(false);
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
