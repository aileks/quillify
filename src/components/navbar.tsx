'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className='border-sidebar-accent border-b-2 text-sidebar-foreground mx-auto bg-sidebar sticky top-0'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
        <Link href='/' className='text-xl font-bold'>
          Quillify
        </Link>

        {status === 'loading' ?
          <Skeleton className='h-9 w-32' />
        : session?.user ?
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
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
                    <Button>{session.user.name || session.user.email || 'Account'}</Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>

                    <DropdownMenuSeparator />

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
                  <Button variant='secondary' asChild>
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
