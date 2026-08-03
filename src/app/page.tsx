import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/server/auth';
import { api, HydrateClient } from '@/trpc/server';
import { pickRandomSaying } from '@/lib/product-sayings';
import { BookOpen, BarChart3, Library, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { HomeDashboard } from './home-dashboard';

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
              Save books to To Read. Move them to Finished when you are done.
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

      {/* Features Section */}
      <section data-slot='features-section' className='border-t px-4 py-20' aria-label='Features'>
        <div className='container mx-auto'>
          <div className='mb-10 text-center'>
            <h2 className='mb-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl'>
              Keep Track of Your Books
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Add books, edit them, and find them again.
            </p>
          </div>

          <Image
            src='/landing-bookshelf.png'
            alt='A shelf of books'
            width={720}
            height={420}
            className='mx-auto mb-12 h-auto w-full max-w-xl'
          />

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'>
                    <Library className='size-6' />
                  </div>
                  <CardTitle className='font-serif text-xl'>Add Books</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Save the title, author, genre, and other useful details.
                </p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'>
                    <BookOpen className='size-6' />
                  </div>
                  <CardTitle className='font-serif text-xl'>Update Their Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>Keep track of your reading progress.</p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'>
                    <BarChart3 className='size-6' />
                  </div>
                  <CardTitle className='font-serif text-xl'>Track Your Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  See how many books and pages you have finished.
                </p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'>
                    <Search className='size-6' />
                  </div>
                  <CardTitle className='font-serif text-xl'>Find Books</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Search by title or author. Filter by genre or status.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        data-slot='how-it-works-section'
        className='bg-muted/50 border-y px-4 py-20'
        aria-label='How it works'
      >
        <div className='container mx-auto'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl'>
              How It Works
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Set up your Library in a few minutes.
            </p>
          </div>

          <div className='mx-auto grid max-w-4xl gap-8 sm:grid-cols-3'>
            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                1
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Create an Account</h3>
              <p className='text-muted-foreground'>Sign up for free.</p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                2
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Add Your Books</h3>
              <p className='text-muted-foreground'>Add books you want to read.</p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                3
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Mark Books Finished</h3>
              <p className='text-muted-foreground'>Update a book when you finish it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Social Proof Section */}
      <section
        data-slot='social-proof-section'
        className='px-4 py-20'
        aria-label='Quillify details'
      >
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-8 font-serif text-3xl font-bold tracking-tight sm:text-4xl'>
              What You Get
            </h2>

            <div className='mb-10 grid gap-6 sm:grid-cols-3'>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>Free to use</p>
              </div>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>Fast search and filters</p>
              </div>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>Simple To Read and Finished states</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        data-slot='cta-section'
        className='bg-primary text-primary-foreground px-4 py-20'
        aria-label='Call to action'
      >
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-4 font-serif text-3xl font-bold sm:text-4xl'>Start Your Library</h2>
            <p className='mb-8 text-lg opacity-90'>Create an account and add your first book.</p>

            <Button
              asChild
              size='lg'
              variant='secondary'
              className='w-full px-8 py-6 text-lg sm:w-auto'
            >
              <Link href='/account/register'>
                Create Account
                <ArrowRight data-icon='inline-end' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <p className='text-muted-foreground text-sm'>
              © {new Date().getFullYear()} Quillify. All rights reserved.
            </p>

            <div className='flex gap-6'>
              <Link
                href='/account/login'
                className='text-muted-foreground hover:text-foreground text-sm transition-colors'
              >
                Log In
              </Link>

              <Link
                href='/account/register'
                className='text-muted-foreground hover:text-foreground text-sm transition-colors'
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
