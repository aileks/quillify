import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import VerifyEmailClient from './verify-email-client';

interface VerifyEmailPageProps {
  searchParams: Promise<{ status?: string; email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const cookieStore = await cookies();
  const redirectToken = cookieStore.get('verify-email-redirect');

  // If no redirect token, user navigated directly - send them away
  if (!redirectToken) {
    redirect('/');
  }

  const params = await searchParams;
  const status = params.status;
  const email = params.email;

  return (
    <main className='flex min-h-screen items-center justify-center p-4'>
      <VerifyEmailClient status={status} email={email} />
    </main>
  );
}
