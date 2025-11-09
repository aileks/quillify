import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const session = await auth();

  // Redirect unauthenticated users to login page
  if (!session?.user) {
    redirect('/account/login');
  }

  return <SettingsForm />;
}
