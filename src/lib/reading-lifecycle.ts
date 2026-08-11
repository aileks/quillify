import { z } from 'zod';

export const READING_STATUSES = [
  'to_read',
  'reading',
  'paused',
  'finished',
  'did_not_finish',
] as const;
export const READING_FORMATS = ['print', 'ebook', 'audiobook'] as const;
export const OWNERSHIP_TYPES = ['unknown', 'owned', 'borrowed', 'library', 'subscription'] as const;

export type ReadingStatus = (typeof READING_STATUSES)[number];
export type ReadingFormat = (typeof READING_FORMATS)[number];
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];

export const readingStatusSchema = z.enum(READING_STATUSES);
export const readingFormatSchema = z.enum(READING_FORMATS);
export const ownershipTypeSchema = z.enum(OWNERSHIP_TYPES);

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  to_read: 'To Read',
  reading: 'Reading',
  paused: 'Paused',
  finished: 'Finished',
  did_not_finish: 'Did Not Finish',
};

export const READING_FORMAT_LABELS: Record<ReadingFormat, string> = {
  print: 'Print',
  ebook: 'Ebook',
  audiobook: 'Audiobook',
};

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  unknown: 'Unknown',
  owned: 'Owned',
  borrowed: 'Borrowed',
  library: 'Library',
  subscription: 'Subscription',
};

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .refine(isValidCalendarDate, 'Enter a valid date')
  .refine((value) => value <= getToday(), 'Date cannot be in the future');

const readingPeriodFieldsObjectSchema = z.object({
  status: readingStatusSchema,
  format: readingFormatSchema.nullable(),
  startedOn: calendarDateSchema.nullable(),
  endedOn: calendarDateSchema.nullable(),
});

export const readingPeriodFieldsSchema =
  readingPeriodFieldsObjectSchema.superRefine(validateReadingDates);

export type ReadingPeriodFields = z.infer<typeof readingPeriodFieldsSchema>;

export const transitionReadingStatusSchema = readingPeriodFieldsObjectSchema
  .extend({ bookId: z.string().min(1) })
  .superRefine(validateReadingDates);

export const updateReadingPeriodSchema = readingPeriodFieldsObjectSchema
  .extend({ id: z.string().min(1) })
  .superRefine(validateReadingDates);

export function getToday(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTerminalReadingStatus(status: ReadingStatus): boolean {
  return status === 'finished' || status === 'did_not_finish';
}

export function startsNewReadingPeriod(
  currentStatus: ReadingStatus,
  nextStatus: ReadingStatus
): boolean {
  return isTerminalReadingStatus(currentStatus) && !isTerminalReadingStatus(nextStatus);
}

export function getReadingDatesAfterStatusChange(
  currentStatus: ReadingStatus,
  nextStatus: ReadingStatus,
  startedOn: string | null,
  endedOn: string | null,
  referenceDate = new Date()
): { startedOn: string | null; endedOn: string | null } {
  if (nextStatus === 'to_read') {
    return { startedOn: null, endedOn: null };
  }

  if (startsNewReadingPeriod(currentStatus, nextStatus)) {
    return {
      startedOn: nextStatus === 'reading' ? getToday(referenceDate) : null,
      endedOn: null,
    };
  }

  if (isTerminalReadingStatus(nextStatus)) {
    return {
      startedOn,
      endedOn: endedOn ?? getToday(referenceDate),
    };
  }

  return {
    startedOn: nextStatus === 'reading' && !startedOn ? getToday(referenceDate) : startedOn,
    endedOn: null,
  };
}

function validateReadingDates(
  values: { status: ReadingStatus; startedOn: string | null; endedOn: string | null },
  context: z.core.$RefinementCtx
) {
  if (values.startedOn && values.endedOn && values.endedOn < values.startedOn) {
    context.addIssue({
      code: 'custom',
      message: 'End date cannot be before start date',
      path: ['endedOn'],
    });
  }

  if (!isTerminalReadingStatus(values.status) && values.endedOn) {
    context.addIssue({
      code: 'custom',
      message: 'Only completed reading periods can have an end date',
      path: ['endedOn'],
    });
  }
}

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}
