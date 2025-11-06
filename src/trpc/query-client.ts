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
          if (code === 'UNAUTHORIZED' || httpStatus === 401) return false;
          return failureCount < 3;
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
