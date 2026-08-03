import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/server/auth';
import { SettingsForm } from './settings-form';

export const metadata: Metadata = {
  title: 'Account Settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/account/login');
  }

  return <SettingsForm />;
}
