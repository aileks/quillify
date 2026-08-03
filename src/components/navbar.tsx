'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { BookOpen, Home, LogIn, LogOut, Menu, Settings, UserPlus } from 'lucide-react';

import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const utils = api.useUtils();

  // Prefetch books data on hover/focus for instant navigation
  const prefetchBooksData = () => {
    // Prefetch the default books list (page 1, sorted by title) - used by /books
    void utils.books.list.prefetch({
      page: 1,
      pageSize: 12,
      sortBy: 'title',
      sortOrder: 'asc',
    });
    void utils.books.stats.prefetch();
  };

  return (
    <nav
      className={cn(
        'border-sidebar-accent text-sidebar-foreground bg-sidebar sticky top-0 z-50 mx-auto border-b-2',
        className
      )}
      aria-label='Main navigation'
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
        <Link href='/' className='font-serif text-xl font-bold' aria-label='Quillify home'>
          Quillify
        </Link>

        {status === 'loading' ?
          <Skeleton className='h-9 w-24' />
        : <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground'
              >
                <Menu data-icon='inline-start' />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {session?.user ?
                <>
                  <DropdownMenuLabel className='truncate'>
                    {session.user.name || session.user.email || 'Account'}
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      asChild
                      onMouseEnter={prefetchBooksData}
                      onFocus={prefetchBooksData}
                    >
                      <Link href='/' aria-current={pathname === '/' ? 'page' : undefined}>
                        <Home />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      asChild
                      onMouseEnter={prefetchBooksData}
                      onFocus={prefetchBooksData}
                    >
                      <Link
                        href='/books'
                        aria-current={pathname.startsWith('/books') ? 'page' : undefined}
                      >
                        <BookOpen />
                        Reading List
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href='/account/settings'
                        aria-current={pathname === '/account/settings' ? 'page' : undefined}
                      >
                        <Settings />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              : <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href='/account/login'
                      aria-current={pathname === '/account/login' ? 'page' : undefined}
                    >
                      <LogIn />
                      Log In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href='/account/register'
                      aria-current={pathname === '/account/register' ? 'page' : undefined}
                    >
                      <UserPlus />
                      Get Started
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              }
            </DropdownMenuContent>
          </DropdownMenu>
        }
      </div>
    </nav>
  );
}
