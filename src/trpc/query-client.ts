import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import SuperJSON from 'superjson';
import type { TRPCErrorShape } from '@/types';

const TRANSIENT_ERROR_CODES = new Set([
  'INTERNAL_SERVER_ERROR',
  'TIMEOUT',
  'BAD_GATEWAY',
  'SERVICE_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
]);

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;

  const trpcError = error as TRPCErrorShape;
  const code = trpcError.data?.code;

  return code === undefined || TRANSIENT_ERROR_CODES.has(code);
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes - avoids unnecessary refetches
        // when navigating between pages
        staleTime: 5 * 60 * 1000,
        // Keep inactive queries in cache for 10 minutes before garbage collection
        // This allows returning to previously viewed pages without refetching
        gcTime: 10 * 60 * 1000,
        // Don't refetch on window focus - reduces unnecessary network requests
        refetchOnWindowFocus: false,
        // Refetch on mount if data is stale - ensures invalidated queries are refreshed on navigation
        refetchOnMount: true,
        // Refetch stale active queries after reconnecting
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        // Include pending queries in SSR hydration to avoid loading states on initial render
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
