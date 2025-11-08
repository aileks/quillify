import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { NewBookForm } from './new-book-form';

export default async function NewBookPage() {
  const session = await auth();

  // Redirect unauthenticated users to landing page
  if (!session?.user) {
    redirect('/');
  }

  return <NewBookForm />;
}
