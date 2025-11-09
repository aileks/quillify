import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Merriweather, Work_Sans, Courier_Prime } from 'next/font/google';
import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from '@/components/auth';
import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';

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
          {/* Skip to main content link */}
          <a
            href='#main-content'
            className='focus:bg-primary focus:text-primary-foreground focus-visible:ring-ring focus:rounded-sm-md sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 md:focus:left-[280px] focus:z-50 focus:px-4 focus:py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
          >
            Skip to main content
          </a>
          <Navbar className='md:hidden' />
          <Sidebar className='hidden md:flex' />
          <main id='main-content' className='md:ml-64'>
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
