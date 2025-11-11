import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';

export default async function Home() {
  const session = await auth();

  // If user is logged in, show dashboard
  if (session?.user) {
    // Fetch all books to calculate statistics (max pageSize is 100, so we may need multiple requests)
    const firstPage = await api.books.list({
      page: 1,
      pageSize: 100,
    });

    const totalBooks = firstPage.totalCount;
    let allBooksItems = [...firstPage.items];

    // If there are more books, fetch remaining pages
    if (totalBooks > 100) {
      const totalPages = firstPage.totalPages;
      const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

      const remainingBooks = await Promise.all(
        remainingPages.map((page) =>
          api.books.list({
            page,
            pageSize: 100,
          })
        )
      );

      allBooksItems = [
        ...allBooksItems,
        ...remainingBooks.flatMap((result) => result.items),
      ];
    }

    const readBooks = allBooksItems.filter((book) => book.isRead).length;
    const unreadBooks = totalBooks - readBooks;
    const totalPagesRead = allBooksItems
      .filter((book) => book.isRead)
      .reduce((sum, book) => sum + book.numberOfPages, 0);

    const userName = session.user.name || session.user.email?.split('@')[0] || 'there';

    return (
      <div className='container mx-auto space-y-8 px-4 py-8 md:px-6'>
        {/* Welcome Section */}
        <div className='space-y-2'>
          <h1 className='font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
            Welcome back, {userName}!
          </h1>
          <p className='text-muted-foreground text-lg sm:text-xl'>
            Here's an overview of your reading journey.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='rounded-sm'>
            <CardHeader>
              <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Total Books
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='font-serif text-3xl font-bold'>{totalBooks}</div>
              <p className='text-muted-foreground mt-1 text-sm'>
                {totalBooks === 1 ? 'book in your library' : 'books in your library'}
              </p>
            </CardContent>
          </Card>

          <Card className='rounded-sm'>
            <CardHeader>
              <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Books Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='font-serif text-3xl font-bold text-green-700 dark:text-green-500'>
                {readBooks}
              </div>
              <p className='text-muted-foreground mt-1 text-sm'>
                {readBooks === 1 ? 'book completed' : 'books completed'}
                {totalBooks > 0 && (
                  <span className='ml-1'>
                    ({Math.round((readBooks / totalBooks) * 100)}%)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className='rounded-sm'>
            <CardHeader>
              <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Books to Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='font-serif text-3xl font-bold text-amber-700 dark:text-amber-500'>
                {unreadBooks}
              </div>
              <p className='text-muted-foreground mt-1 text-sm'>
                {unreadBooks === 1 ? 'book waiting' : 'books waiting'}
                {totalBooks > 0 && (
                  <span className='ml-1'>
                    ({Math.round((unreadBooks / totalBooks) * 100)}%)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className='rounded-sm'>
            <CardHeader>
              <CardTitle className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
                Pages Read
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='font-serif text-3xl font-bold'>{totalPagesRead.toLocaleString()}</div>
              <p className='text-muted-foreground mt-1 text-sm'>
                {totalPagesRead === 1 ? 'page' : 'pages'} across all completed books
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className='flex justify-center pt-4'>
          <Button asChild size='lg' className='w-full sm:w-auto px-7 py-4 text-lg'>
            <Link href='/books'>View Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Unauthenticated users see the landing page
  return (
    <div className='flex min-h-screen flex-col'>
      {/* Hero Section */}
      <section
        className='flex flex-1 items-center justify-center border-b px-4'
        aria-label='Hero section'
      >
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
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
      <section
        className='flex flex-1 items-center justify-center border-t px-4'
        aria-label='Call to action'
      >
        <div className='container mx-auto'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='mb-4 text-2xl font-bold sm:text-3xl md:text-4xl'>
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
