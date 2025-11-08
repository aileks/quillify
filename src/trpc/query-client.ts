import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import SuperJSON from 'superjson';
import type { TRPCErrorShape } from '@/types';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry(failureCount, error: unknown) {
          const e = error as TRPCErrorShape;
          const code = e?.data?.code;
          const httpStatus = e?.data?.httpStatus;
          // Don't retry on UNAUTHORIZED or NOT_FOUND errors
          if (code === 'UNAUTHORIZED' || httpStatus === 401) return false;
          if (code === 'NOT_FOUND' || httpStatus === 404) return false;
          // Retry up to 2 times (3 total attempts -> 2 retries)
          return failureCount < 2;
        },
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
