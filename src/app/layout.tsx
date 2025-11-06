import type { Metadata } from 'next';
import { Merriweather, Inter } from 'next/font/google';
import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from '@/components/auth';
import '@/styles/globals.css';

const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
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
      <body className={`${merriweather.variable} ${inter.variable} antialiased`}>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
