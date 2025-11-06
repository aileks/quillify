'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
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
    <nav className='border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
        <Link href='/' className='text-xl font-bold'>
          Quillify
        </Link>

        <div className='flex items-center gap-4'>
          {status === 'loading' ?
            <div className='h-9 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800' />
          : session?.user ?
            <>
              <Link href='/books'>
                <Button variant='ghost'>Books</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline'>
                    {session.user.name || session.user.email || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/account'>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className='cursor-pointer text-red-600 dark:text-red-400'
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          : <>
              <Button variant='ghost' asChild>
                <Link href='/account/login'>Log In</Link>
              </Button>
              <Button asChild>
                <Link href='/account/register'>Get Started</Link>
              </Button>
            </>
          }
        </div>
      </div>
    </nav>
  );
}
