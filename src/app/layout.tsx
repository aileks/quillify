import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Merriweather, Work_Sans, Courier_Prime } from 'next/font/google';
import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from '@/components/auth';
import { LayoutShell } from '@/app/layout-shell';
import { Toaster } from '@/components/ui/sonner';

const merriweather = Merriweather({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const workSans = Work_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const courierPrime = Courier_Prime({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Quillify',
  description: 'Your Book Tracker',
  icons: {
    icon: 'favicon.ico',
    apple: 'apple-touch-icon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${merriweather.variable} ${workSans.variable} ${courierPrime.variable} bg-background text-foreground font-serif antialiased`}
      >
        <SessionProvider>
          <TRPCReactProvider>
            <LayoutShell>{children}</LayoutShell>
          </TRPCReactProvider>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
