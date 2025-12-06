import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import SuperJSON from 'superjson';
import type { TRPCErrorShape } from '@/types';

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
        // Don't refetch on mount if data is fresh - uses cached data when available
        refetchOnMount: false,
        // Only refetch on reconnect if data is stale
        refetchOnReconnect: 'always',
        retry(failureCount, error: unknown) {
          const e = error as TRPCErrorShape;
          const code = e?.data?.code;
          const httpStatus = e?.data?.httpStatus;
          // Don't retry on UNAUTHORIZED or NOT_FOUND errors (these won't succeed on retry)
          if (code === 'UNAUTHORIZED' || httpStatus === 401) return false;
          if (code === 'NOT_FOUND' || httpStatus === 404) return false;
          // Retry up to 2 times (3 total attempts -> 2 retries)
          return failureCount < 2;
        },
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
