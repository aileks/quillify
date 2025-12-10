'use client';

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { httpBatchStreamLink, loggerLink, type TRPCClientError } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import SuperJSON from 'superjson';

import { type AppRouter } from '@/server/api/root';
import { createQueryClient } from './query-client';

let clientQueryClientSingleton: QueryClient | undefined = undefined;
/**
 * Get or create a QueryClient instance.
 * Uses singleton pattern in browser to preserve cache across re-renders,
 * but creates fresh instances on server for each request to avoid data leakage.
 */
const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client to avoid sharing state between requests
    return createQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client across re-renders
  clientQueryClientSingleton ??= createQueryClient();

  return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) => {
            // Skip logging NOT_FOUND errors (handled gracefully by the app)
            if (op.direction === 'down' && op.result instanceof Error) {
              const trpcError = op.result as TRPCClientError<AppRouter>;
              if (trpcError.data?.code === 'NOT_FOUND') {
                return false;
              }
            }
            return (
              process.env.NODE_ENV === 'development' ||
              (op.direction === 'down' && op.result instanceof Error)
            );
          },
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + '/api/trpc',
          headers: () => {
            const headers = new Headers();
            headers.set('x-trpc-source', 'nextjs-react');
            return headers;
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
