import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Merriweather, Work_Sans, Courier_Prime } from 'next/font/google';
import { TRPCReactProvider } from '@/trpc/react';
import { api, HydrateClient } from '@/trpc/server';
import { SessionProvider } from '@/components/auth';
import { LayoutShell } from '@/app/layout-shell';
import { Toaster } from '@/components/ui/sonner';
import { auth } from '@/server/auth';

const merriweather = Merriweather({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: 'variable',
});

const workSans = Work_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: 'variable',
});

const courierPrime = Courier_Prime({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Quillify',
    template: '%s | Quillify',
  },
  description: 'Your Personal Library',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (session?.user) {
    await api.releases.unseen.prefetch();
  }

  return (
    <html lang='en'>
      <body
        className={`${merriweather.variable} ${workSans.variable} ${courierPrime.variable} bg-background text-foreground font-sans antialiased`}
      >
        <SessionProvider session={session}>
          <TRPCReactProvider>
            <HydrateClient>
              <LayoutShell>{children}</LayoutShell>
            </HydrateClient>
          </TRPCReactProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
