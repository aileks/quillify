import { notFound } from 'next/navigation';

import { ListDetailClient } from './list-detail-client';
import { api, HydrateClient } from '@/trpc/server';

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

/**
 * List detail page - prefetches the list with its ordered entries.
 */
interface ListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { id } = await params;

  try {
    await api.lists.getById.prefetch({ id });
  } catch {
    notFound();
  }

  return (
    <HydrateClient>
      <ListDetailClient listId={id} />
    </HydrateClient>
  );
}
