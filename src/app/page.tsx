import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, CheckCircle2, Tag, Edit3, Lock, LayoutGrid } from 'lucide-react';
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
                  <BookOpen className='h-6 w-6' />
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
                  <CheckCircle2 className='h-6 w-6' />
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
                  <Tag className='h-6 w-6' />
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
                  <Edit3 className='h-6 w-6' />
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
                  <Lock className='h-6 w-6' />
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
                  <LayoutGrid className='h-6 w-6' />
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
