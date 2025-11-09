import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Merriweather, Work_Sans, Courier_Prime } from 'next/font/google';
import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from '@/components/auth';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';

const merriweather = Merriweather({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

const workSans = Work_Sans({
  variable: '--font-secondary',
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
        className={`${merriweather.variable} ${workSans.variable} ${courierPrime.variable} bg-background text-foreground antialiased`}
      >
        <SessionProvider>
          {/* Skip to main content link */}
          <a
            href='#main-content'
            className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          >
            Skip to main content
          </a>
          <Navbar />
          <main id='main-content'>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
