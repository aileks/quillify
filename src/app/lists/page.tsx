import { ListsClient } from './lists-client';
import { api, HydrateClient } from '@/trpc/server';
import { pickRandomSaying } from '@/lib/product-sayings';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

/**
 * Lists index page - prefetches the reader's lists and hydrates them into React Query.
 */
export default async function ListsPage() {
  const subtitle = pickRandomSaying('lists');

  await api.lists.summary.prefetch();

  return (
    <HydrateClient>
      <ListsClient subtitle={subtitle} />
    </HydrateClient>
  );
}
