import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { auth } from '@/server/auth';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn why Quillify offers a simple, focused home for your reading list.',
};

const values = [
  {
    number: '01',
    title: 'Simple',
    description: 'Add books, update their status, and keep moving.',
  },
  {
    number: '02',
    title: 'Focused',
    description: 'Keep To Read and Finished books easy to find.',
  },
  {
    number: '03',
    title: 'Personal',
    description: 'Track the books and progress that matter to you.',
  },
] as const;

export default async function AboutPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  return (
    <div className='min-h-screen overflow-hidden'>
      <section className='border-border border-b px-4 py-16 sm:py-20 lg:py-28'>
        <div className='container mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20'>
          <div className='max-w-4xl'>
            <p className='text-primary mb-5 font-mono text-xs font-bold tracking-[0.22em] uppercase'>
              About Quillify
            </p>
            <h1 className='text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl lg:text-7xl'>
              A focused home for the books you want to read.
            </h1>
            <p className='text-muted-foreground mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl'>
              Keep the books you want to read in one Library, then mark them Finished when you are
              done.
            </p>
          </div>

          <div className='border-primary/30 bg-card relative mx-auto flex aspect-square w-full max-w-64 items-center justify-center rounded-sm border shadow-lg lg:max-w-none'>
            <div
              className='border-primary/20 absolute inset-4 rounded-sm border'
              aria-hidden='true'
            />
            <Image
              src='/quill-logo.png'
              alt=''
              width={160}
              height={160}
              sizes='160px'
              className='relative size-40 object-contain'
            />
          </div>
        </div>
      </section>

      <section
        className='bg-sidebar text-sidebar-foreground px-4 py-16 sm:py-20 lg:py-24'
        aria-labelledby='quillify-values'
      >
        <div className='container mx-auto max-w-7xl'>
          <div className='max-w-3xl'>
            <p className='text-sidebar-primary font-mono text-xs font-bold tracking-[0.18em] uppercase'>
              What guides it
            </p>
            <h2 id='quillify-values' className='mt-3 text-4xl font-bold sm:text-5xl'>
              Simple. Focused. Personal.
            </h2>
          </div>

          <div className='border-sidebar-border mt-12 grid border-t md:grid-cols-3'>
            {values.map((value) => (
              <article
                key={value.number}
                className='border-sidebar-border flex flex-col gap-4 border-b py-8 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0 md:last:pr-0'
              >
                <p className='text-sidebar-primary font-mono text-xs font-bold'>{value.number}</p>
                <h3 className='text-2xl font-bold'>{value.title}</h3>
                <p className='text-sidebar-foreground/75 leading-relaxed'>{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {isAuthenticated ? null : (
        <section className='px-4 py-20 sm:py-24 lg:py-28' aria-labelledby='about-next-step'>
          <div className='container mx-auto max-w-7xl'>
            <div className='border-primary/30 bg-card grid gap-8 rounded-sm border p-6 shadow-lg sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12'>
              <div className='max-w-2xl'>
                <h2 id='about-next-step' className='text-3xl font-bold sm:text-4xl'>
                  Bring your TBR together.
                </h2>
                <p className='text-muted-foreground mt-4 text-lg leading-relaxed'>
                  Create an account and give every book on your list one clear place.
                </p>
              </div>

              <div className='flex flex-col gap-3 sm:flex-row'>
                <Button asChild size='lg' className='w-full sm:w-auto'>
                  <Link href='/account/register'>
                    Create Account
                    <ArrowRight data-icon='inline-end' />
                  </Link>
                </Button>
                <Button asChild size='lg' variant='outline' className='w-full sm:w-auto'>
                  <Link href='/account/login'>Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
