import { describe, expect, it } from 'vitest';

import { shouldRetryQuery } from '@/trpc/query-client';

function createTRPCError(code: string) {
  return {
    data: {
      code,
      httpStatus: 500,
    },
  };
}

describe('query retry policy', () => {
  it('retries transient and network failures once', () => {
    expect(shouldRetryQuery(0, new Error('network failure'))).toBe(true);
    expect(shouldRetryQuery(0, createTRPCError('TIMEOUT'))).toBe(true);
    expect(shouldRetryQuery(1, createTRPCError('TIMEOUT'))).toBe(false);
  });

  it('does not retry failures that require a different request or user action', () => {
    expect(shouldRetryQuery(0, createTRPCError('BAD_REQUEST'))).toBe(false);
    expect(shouldRetryQuery(0, createTRPCError('UNAUTHORIZED'))).toBe(false);
    expect(shouldRetryQuery(0, createTRPCError('NOT_FOUND'))).toBe(false);
    expect(shouldRetryQuery(0, createTRPCError('TOO_MANY_REQUESTS'))).toBe(false);
  });
});
