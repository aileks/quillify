import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { auth } from '@/server/auth';
import { api, HydrateClient } from '@/trpc/server';
import { pickRandomSaying } from '@/lib/product-sayings';
import { HomeDashboard } from './home-dashboard';
import { LandingPromotionalSections } from './landing-product-preview';

export default async function Home() {
  const session = await auth();
  const subtitle = pickRandomSaying('home');

  // If user is logged in, show dashboard
  // Data fetching is handled client-side for instant cached navigation
  if (session?.user) {
    const userName = session.user.name || session.user.email?.split('@')[0] || 'there';
    void api.books.stats.prefetch();
    return (
      <HydrateClient>
        <HomeDashboard userName={userName} subtitle={subtitle} />
      </HydrateClient>
    );
  }

  // Unauthenticated users see the landing page
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero Section */}
      <section
        data-slot='hero-section'
        className='relative isolate flex min-h-[80vh] items-center overflow-hidden px-4 py-20 text-white'
        aria-label='Hero section'
      >
        <Image
          src='/landing-hero-background.webp'
          alt=''
          fill
          priority
          sizes='100vw'
          className='scale-105 object-cover blur-[3px]'
        />
        <div className='absolute inset-0 bg-black/40' />
        <div
          className='absolute inset-0'
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 20%, rgba(24, 14, 10, 0.78) 100%)',
          }}
        />

        <div className='relative container mx-auto max-w-6xl'>
          <div className='max-w-3xl text-center lg:text-left'>
            <h1 className='mb-6 font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-6xl xl:text-7xl'>
              Keep Your Reading List <span className='text-sidebar-primary'>in One Place</span>
            </h1>

            <p className='mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl lg:mx-0'>
              Save books to a digital shelf. Mark them as finished when you are done. Nice and tidy!
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start'>
              <Button asChild size='lg' className='w-full px-8 py-6 text-lg sm:w-auto'>
                <Link href='/account/register'>
                  Create a Free Account
                  <ArrowRight data-icon='inline-end' />
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='w-full border-white/35 bg-black/20 px-8 py-6 text-lg text-white hover:bg-black/35 hover:text-white sm:w-auto'
              >
                <Link href='/account/login'>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingPromotionalSections />
    </div>
  );
}
