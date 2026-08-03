import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LandingBook {
  id: string;
  title: string;
  author: string;
  year: number;
  pages: number;
  genre: string;
  visibilityClass?: string;
}

const landingBooks: LandingBook[] = [
  {
    id: '0001',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    year: 1895,
    pages: 122,
    genre: 'Science Fiction',
  },
  {
    id: '0002',
    title: 'The Adventures of Tom Sawyer',
    author: 'Mark Twain',
    year: 1876,
    pages: 274,
    genre: 'Classic Fiction',
  },
  {
    id: '0003',
    title: 'Silas Marner',
    author: 'George Eliot',
    year: 1861,
    pages: 192,
    genre: 'Historical Fiction',
    visibilityClass: 'hidden sm:block',
  },
  {
    id: '0004',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    year: 1847,
    pages: 500,
    genre: 'Classic Fiction',
    visibilityClass: 'hidden sm:block',
  },
  {
    id: '0005',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    year: 1851,
    pages: 635,
    genre: 'Classic Fiction',
    visibilityClass: 'hidden xl:block',
  },
  {
    id: '0006',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    year: 1911,
    pages: 288,
    genre: "Children's Fiction",
    visibilityClass: 'hidden xl:block',
  },
];

interface PreviewControlProps {
  label: string;
  value: string;
  className?: string;
  icon?: ReactNode;
  hasChevron?: boolean;
}

function PreviewControl({
  label,
  value,
  className,
  icon,
  hasChevron = false,
}: PreviewControlProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className='text-xs font-medium'>{label}</span>
      <div className='border-foreground/15 bg-background flex h-10 items-center gap-2 rounded-sm border px-3 text-sm'>
        {icon}
        <span className='min-w-0 flex-1 truncate'>{value}</span>
        {hasChevron ?
          <ChevronDown className='text-muted-foreground size-4 shrink-0' />
        : null}
      </div>
    </div>
  );
}

function LibraryBookCard({ book, className }: { book: LandingBook; className?: string }) {
  return (
    <article
      className={cn(
        'bg-card text-card-foreground border-foreground/10 flex h-full min-h-72 flex-col rounded-sm border-2 p-3 shadow-sm',
        className
      )}
    >
      <div className='text-muted-foreground mb-3 text-right font-mono text-[10px]'>#{book.id}</div>
      <h3 className='mb-5 font-serif text-base leading-tight font-bold'>{book.title}</h3>

      <div className='border-primary/20 mb-4 border-l-2 pl-3'>
        <div className='text-muted-foreground mb-1 text-[10px] font-medium tracking-wide uppercase'>
          Author
        </div>
        <div className='font-serif text-sm leading-snug'>{book.author}</div>
      </div>

      <div className='mb-4 grid grid-cols-2 gap-3 text-xs'>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
            Year
          </span>
          <span className='font-medium'>{book.year}</span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
            Pages
          </span>
          <span className='font-medium'>{book.pages}</span>
        </div>
      </div>

      <div className='mb-4 flex flex-col gap-1'>
        <span className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
          Genre
        </span>
        <span className='text-xs font-medium'>{book.genre}</span>
      </div>

      <div className='border-foreground/10 mt-auto flex items-center justify-between border-t pt-3'>
        <span className='text-muted-foreground font-mono text-[10px] tracking-wider uppercase'>
          Status
        </span>
        <Badge variant='outline' className='text-primary border-primary/40 rounded-sm'>
          To Read
        </Badge>
      </div>
    </article>
  );
}

function LibraryShowcase() {
  return (
    <section
      data-slot='library-showcase-section'
      className='border-primary/20 border-t px-4 py-20 sm:py-24 lg:py-28'
      aria-labelledby='library-showcase-title'
    >
      <div className='container mx-auto max-w-7xl'>
        <div className='max-w-4xl'>
          <h2
            id='library-showcase-title'
            className='font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl'
          >
            Turn a scattered TBR into a focused Library
          </h2>
          <p className='text-muted-foreground mt-5 max-w-2xl text-lg leading-relaxed sm:text-xl'>
            Save every book you want to read in one place, with the details that make your list
            useful.
          </p>
        </div>

        <figure className='border-primary/30 bg-card mt-12 rounded-sm border p-4 shadow-lg sm:p-6 lg:p-8'>
          <figcaption className='sr-only'>
            Preview of a Quillify Library with search, filters, sorting, and To Read book cards.
          </figcaption>

          <div aria-hidden='true'>
            <div className='mb-7'>
              <h3 className='font-serif text-3xl font-bold'>My Library</h3>
              <p className='text-muted-foreground mt-1 text-sm'>
                Every finished book began as a maybe.
              </p>
            </div>

            <div className='mb-6 grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))_auto]'>
              <PreviewControl
                label='Search'
                value='Search by title, author, or genre'
                icon={<Search className='text-muted-foreground size-4 shrink-0' />}
                className='md:col-span-2 xl:col-span-1'
              />
              <PreviewControl label='Genre' value='All Genres' hasChevron />
              <PreviewControl label='Status' value='To Read' hasChevron />
              <PreviewControl label='Sort by' value='Date Added' hasChevron />
              <PreviewControl label='Order' value='Newest First' hasChevron />
              <Button
                asChild
                className='pointer-events-none w-full md:col-span-2 xl:col-span-1 xl:w-auto'
              >
                <span>Add to List</span>
              </Button>
            </div>

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6'>
              {landingBooks.map((book) => (
                <div key={book.id} className={book.visibilityClass}>
                  <LibraryBookCard book={book} />
                </div>
              ))}
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-sm font-medium'>{label}</span>
      <div className='border-foreground/15 bg-background flex h-12 items-center rounded-sm border px-4 text-base'>
        {value}
      </div>
    </div>
  );
}

function AddBookPreview() {
  return (
    <div className='relative'>
      <div className='border-sidebar-primary/30 bg-card text-card-foreground flex flex-col gap-6 rounded-sm border p-6 shadow-xl sm:p-8'>
        <h3 className='font-serif text-2xl font-bold sm:text-3xl'>Add New Book</h3>
        <PreviewField label='Title' value='Jane Eyre' />
        <PreviewField label='Author' value='Charlotte Brontë' />
        <PreviewField label='Pages' value='500' />
        <PreviewField label='Publication Year' value='1847' />
        <PreviewControl label='Genre' value='Classics' hasChevron />

        <div className='flex flex-col gap-3 sm:flex-row'>
          <Button asChild className='pointer-events-none flex-1'>
            <span>Add Book</span>
          </Button>
          <Button asChild variant='outline' className='pointer-events-none flex-1'>
            <span>Cancel</span>
          </Button>
        </div>
      </div>

      <ArrowRight className='text-primary absolute top-1/2 -right-9 hidden size-6 xl:block' />
    </div>
  );
}

function SearchResultPreview() {
  const janeEyre = landingBooks[3];

  if (!janeEyre) {
    return null;
  }

  return (
    <div className='border-sidebar-primary/30 bg-card text-card-foreground flex flex-col gap-6 rounded-sm border p-6 shadow-xl sm:p-8'>
      <h3 className='font-serif text-2xl font-bold sm:text-3xl'>My Library</h3>

      <div className='grid gap-3 sm:grid-cols-2'>
        <PreviewControl
          label='Search'
          value='Jane'
          icon={<Search className='text-muted-foreground size-4 shrink-0' />}
        />
        <PreviewControl label='Status' value='To Read' hasChevron />
      </div>

      <LibraryBookCard book={janeEyre} className='min-h-96 shadow-none' />
    </div>
  );
}

function AddAndFindWorkflow() {
  return (
    <section
      data-slot='add-find-section'
      className='bg-sidebar text-sidebar-foreground px-4 py-20 sm:py-24 lg:py-28'
      aria-labelledby='add-find-title'
    >
      <div className='container mx-auto grid max-w-7xl items-center gap-12 xl:grid-cols-[0.9fr_2.05fr] xl:gap-16'>
        <div className='max-w-xl'>
          <h2
            id='add-find-title'
            className='font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl'
          >
            Add once. Find it when you&apos;re ready.
          </h2>
          <p className='text-sidebar-foreground/75 mt-6 text-lg leading-relaxed sm:text-xl'>
            Capture the title, author, pages, year, and genre. Your Library keeps every <em>maybe</em> easy
            to find.
          </p>
        </div>

        <figure className='grid items-center gap-12 md:grid-cols-2 xl:gap-16'>
          <figcaption className='sr-only'>
            Preview showing Jane Eyre added to Quillify and found later in the Library.
          </figcaption>
          <div aria-hidden='true'>
            <AddBookPreview />
          </div>
          <div aria-hidden='true'>
            <SearchResultPreview />
          </div>
        </figure>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <>
      <section
        data-slot='landing-cta-section'
        className='px-4 py-24 sm:py-28 lg:py-36'
        aria-labelledby='landing-cta-title'
      >
        <div className='container mx-auto max-w-7xl'>
          <div className='max-w-3xl'>
            <h2
              id='landing-cta-title'
              className='font-serif text-5xl leading-tight font-bold tracking-tight sm:text-6xl lg:text-7xl'
            >
              Bring your TBR together
            </h2>
            <p className='text-muted-foreground mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl'>
              Create a free account and add the books already waiting on your list.
            </p>

            <Button asChild size='lg' className='mt-10 w-full px-8 py-6 text-lg sm:w-auto'>
              <Link href='/account/register'>
                Create a Free Account
                <ArrowRight data-icon='inline-end' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className='border-sidebar-primary/30 bg-sidebar text-sidebar-foreground border-t px-4 py-12'>
        <div className='container mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sidebar-foreground/70 text-sm'>
            © {new Date().getFullYear()} Quillify. All rights reserved.
          </p>

          <div className='flex gap-6'>
            <Link
              href='/account/login'
              className='text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm transition-colors'
            >
              Log In
            </Link>
            <Link
              href='/account/register'
              className='border-sidebar-primary/50 text-sidebar-foreground/70 hover:text-sidebar-foreground border-l pl-6 text-sm transition-colors'
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export function LandingPromotionalSections() {
  return (
    <>
      <LibraryShowcase />
      <AddAndFindWorkflow />
      <FinalCta />
    </>
  );
}
