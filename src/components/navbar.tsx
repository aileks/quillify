'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { data: session, status } = useSession();
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
    // Prefetch stats data (pageSize 100) - used by home dashboard
    void utils.books.list.prefetch({
      page: 1,
      pageSize: 100,
    });
  };

  return (
    <nav
      className={cn(
        'border-sidebar-accent text-sidebar-foreground bg-sidebar sticky top-0 z-50 mx-auto border-b-2 font-serif',
        className
      )}
      aria-label='Main navigation'
    >
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
        <Link href='/' className='text-xl font-bold' aria-label='Quillify home'>
          Quillify
        </Link>

        {status === 'loading' ?
          <Skeleton className='h-9 w-32' />
        : session?.user ?
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem onMouseEnter={prefetchBooksData} onFocus={prefetchBooksData}>
                <NavigationMenuLink asChild>
                  <Button
                    variant='outline'
                    asChild
                    className='text-background hover:text-background'
                  >
                    <Link href='/' className={navigationMenuTriggerStyle()}>
                      Home
                    </Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem onMouseEnter={prefetchBooksData} onFocus={prefetchBooksData}>
                <NavigationMenuLink asChild>
                  <Button
                    variant='outline'
                    asChild
                    className='text-background hover:text-background'
                  >
                    <Link href='/books' className={navigationMenuTriggerStyle()}>
                      Books
                    </Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className='rounded-sm'>
                      {session.user.name || session.user.email || 'Account'}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Link href='/account/settings'>Settings</Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className='cursor-pointer text-red-600 dark:text-red-400'
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        : <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Button
                    variant='outline'
                    asChild
                    className='text-background hover:text-background'
                  >
                    <Link href='/account/login' className={navigationMenuTriggerStyle()}>
                      Log In
                    </Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Button asChild>
                    <Link href='/account/register' className={navigationMenuTriggerStyle()}>
                      Get Started
                    </Link>
                  </Button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        }
      </div>
    </nav>
  );
}
