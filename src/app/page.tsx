import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/server/auth';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/books');
  }
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='border-b py-20 sm:py-32'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-6xl'>
              Your Personal Library, Beautifully Organized
            </h1>
            <p className='text-muted-foreground mb-8 text-lg leading-8 sm:text-xl'>
              Track your reading journey with Quillify. Organize your books, monitor your progress,
              and discover insights about your reading habits.
            </p>
            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button asChild size='lg' className='w-full sm:w-auto'>
                <Link href='/account/register'>Get Started Free</Link>
              </Button>
              <Button asChild variant='outline' size='lg' className='w-full sm:w-auto'>
                <Link href='/account/login'>Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 sm:py-32'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto mb-16 max-w-2xl text-center'>
            <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
              Everything You Need to Manage Your Reading
            </h2>
            <p className='text-muted-foreground text-lg'>
              Powerful features designed to help you track and organize your personal library.
            </p>
          </div>

          <div className='mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <CardTitle>Comprehensive Library</CardTitle>
                <CardDescription>
                  Store unlimited books with detailed information including title, author, genre,
                  page count, and publication year.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                    />
                  </svg>
                </div>
                <CardTitle>Reading Progress</CardTitle>
                <CardDescription>
                  Track which books you&apos;ve read and which ones are still on your list. Stay
                  organized and motivated.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                    />
                  </svg>
                </div>
                <CardTitle>Genre Organization</CardTitle>
                <CardDescription>
                  Categorize your books by genre for easy discovery. Browse your collection the way
                  that makes sense to you.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    />
                  </svg>
                </div>
                <CardTitle>Easy Editing</CardTitle>
                <CardDescription>
                  Update book details, mark books as read, or remove items from your collection with
                  just a few clicks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your personal library is protected with industry-standard security. Your data
                  belongs to you.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-lg border'>
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'
                    />
                  </svg>
                </div>
                <CardTitle>Beautiful Interface</CardTitle>
                <CardDescription>
                  Clean, modern design that puts your books front and center. Enjoy a delightful
                  reading management experience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='border-t py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
              Start Organizing Your Library Today
            </h2>
            <p className='text-muted-foreground mb-8 text-lg'>
              Join readers who trust Quillify to manage their personal book collections. No credit
              card required.
            </p>
            <Button asChild size='lg' className='w-full sm:w-auto'>
              <Link href='/account/register'>Create Your Free Account</Link>
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
                Sign In
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
