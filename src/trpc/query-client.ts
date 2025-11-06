import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import SuperJSON from 'superjson';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry(failureCount, error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = error as any;
          const code = e?.data?.code; // tRPC code (e.g., 'UNAUTHORIZED')
          const httpStatus = e?.data?.httpStatus; // tRPC http status (e.g., 401)
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
