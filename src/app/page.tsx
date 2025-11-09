import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth } from '@/server/auth';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect('/books');
  }
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero Section */}
      <section className='flex flex-1 items-center justify-center border-b px-4' aria-label='Hero section'>
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-6xl'>
              Your Personal Library, Beautifully Organized
            </h1>

            <p className='text-muted-foreground mb-8 text-lg leading-8 sm:text-xl'>
              Track your reading journey with Quillify. Organize your books, monitor your progress,
              and discover insights about your reading habits.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='flex flex-1 items-center justify-center border-t px-4' aria-label='Call to action'>
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
              Start Organizing Your Library Today
            </h2>

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
