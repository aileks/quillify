import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/server/auth';
import { BookOpen, BarChart3, Library, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { HomeDashboard } from './home-dashboard';

export default async function Home() {
  const session = await auth();

  // If user is logged in, show dashboard
  // Data fetching is handled client-side for instant cached navigation
  if (session?.user) {
    const userName = session.user.name || session.user.email?.split('@')[0] || 'there';
    return <HomeDashboard userName={userName} />;
  }

  // Unauthenticated users see the landing page
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero Section */}
      <section
        data-slot='hero-section'
        className='relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-20'
        aria-label='Hero section'
      >
        {/* Background decoration */}
        <div className='bg-primary/5 absolute inset-0 -z-10' />
        <div className='bg-primary/10 absolute -top-40 -right-40 -z-10 h-80 w-80 rounded-full blur-3xl' />
        <div className='bg-primary/10 absolute -bottom-40 -left-40 -z-10 h-80 w-80 rounded-full blur-3xl' />

        <div className='container mx-auto'>
          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='mb-6 font-serif text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
              Your Personal Library, <span className='text-primary'>Beautifully Organized</span>
            </h1>

            <p className='text-muted-foreground mx-auto mb-10 max-w-2xl text-lg leading-relaxed sm:text-xl'>
              Track every book you read, monitor your progress, and discover insights about your
              reading habits. Quillify makes managing your library simple and enjoyable.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button asChild size='lg' className='w-full px-8 py-6 text-lg sm:w-auto'>
                <Link href='/account/register'>
                  Get Started Free
                  <ArrowRight className='ml-2 size-5' />
                </Link>
              </Button>
              <Button
                asChild
                variant='outline'
                size='lg'
                className='w-full px-8 py-6 text-lg sm:w-auto'
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
          <div className='mb-16 text-center'>
            <h2 className='mb-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl'>
              Everything You Need to Track Your Reading
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Simple tools to organize your books and understand your reading patterns.
            </p>
          </div>

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Library className='size-6' />
                </div>
                <CardTitle className='font-serif text-xl'>Organize Your Library</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Add books to your collection and categorize them by genre, author, or custom tags.
                </p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                  <BookOpen className='size-6' />
                </div>
                <CardTitle className='font-serif text-xl'>Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Mark books as read or unread, track page counts, and see your completion rate.
                </p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                  <BarChart3 className='size-6' />
                </div>
                <CardTitle className='font-serif text-xl'>Discover Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  View statistics about your reading habits, including total pages and books read.
                </p>
              </CardContent>
            </Card>

            <Card className='rounded-sm border-0 bg-transparent shadow-none'>
              <CardHeader className='pb-2'>
                <div className='bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg'>
                  <Search className='size-6' />
                </div>
                <CardTitle className='font-serif text-xl'>Search and Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Quickly find any book in your collection with powerful search and filter options.
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
              Start Tracking in Three Simple Steps
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Getting started with Quillify takes just a few minutes.
            </p>
          </div>

          <div className='mx-auto grid max-w-4xl gap-8 sm:grid-cols-3'>
            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                1
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Create Your Account</h3>
              <p className='text-muted-foreground'>
                Sign up for free and get instant access to your personal library dashboard.
              </p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                2
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Add Your Books</h3>
              <p className='text-muted-foreground'>
                Enter details about books you own, have read, or plan to read next.
              </p>
            </div>

            <div className='flex flex-col items-center text-center'>
              <div className='bg-primary text-primary-foreground mb-4 flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-bold'>
                3
              </div>
              <h3 className='mb-2 font-serif text-xl font-semibold'>Track Your Progress</h3>
              <p className='text-muted-foreground'>
                Update your reading status and watch your statistics grow over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Social Proof Section */}
      <section
        data-slot='social-proof-section'
        className='px-4 py-20'
        aria-label='Why readers love Quillify'
      >
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-8 font-serif text-3xl font-bold tracking-tight sm:text-4xl'>
              Built for Book Lovers
            </h2>

            <div className='mb-10 grid gap-6 sm:grid-cols-3'>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>Free to use</p>
              </div>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>No ads or tracking</p>
              </div>
              <div className='flex flex-col items-center'>
                <CheckCircle2 className='text-primary mb-2 size-6' />
                <p className='text-muted-foreground text-sm'>Your data stays yours</p>
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
            <h2 className='mb-4 font-serif text-3xl font-bold sm:text-4xl'>
              Ready to Organize Your Library?
            </h2>
            <p className='mb-8 text-lg opacity-90'>
              Join Quillify today and take control of your reading journey.
            </p>

            <Button
              asChild
              size='lg'
              variant='secondary'
              className='w-full px-8 py-6 text-lg sm:w-auto'
            >
              <Link href='/account/register'>
                Create Your Free Account
                <ArrowRight className='ml-2 size-5' />
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
