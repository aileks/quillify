'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { BookOpen, LogIn, UserPlus, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-sm border md:hidden'
        aria-label='Toggle sidebar'
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ?
          <X className='size-5' />
        : <Menu className='size-5' />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className='bg-background/80 fixed inset-0 z-40 md:hidden'
          onClick={() => setIsMobileOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 z-50 flex h-screen w-64 flex-col border-r font-serif transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
        aria-label='Sidebar navigation'
      >
        <div className='border-sidebar-border flex flex-col border-b px-6 py-4'>
          <div className='text-sidebar-foreground text-xl font-bold'>
            Quillify
          </div>
          {status === 'loading' ?
            <Skeleton className='mt-2 h-4 w-32' />
          : session?.user ?
            <div className='text-sidebar-foreground/80 mt-2 flex items-center gap-2 text-sm'>
              <User className='size-4' />
              {session.user.name || session.user.email || 'User'}
            </div>
          : null}
        </div>

        <nav className='flex flex-1 flex-col gap-1 p-4'>
          {status === 'loading' ?
            <div className='space-y-2'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          : session?.user ?
            <>
              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname.startsWith('/books') &&
                    'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/books' onClick={() => setIsMobileOpen(false)}>
                  <BookOpen className='size-4' />
                  Books
                </Link>
              </Button>

              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname === '/account/settings' &&
                    'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/account/settings' onClick={() => setIsMobileOpen(false)}>
                  <Settings className='size-4' />
                  Settings
                </Link>
              </Button>
            </>
          : <>
              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname === '/account/login' &&
                    'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/account/login' onClick={() => setIsMobileOpen(false)}>
                  <LogIn className='size-4' />
                  Log In
                </Link>
              </Button>

              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname === '/account/register' &&
                    'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/account/register' onClick={() => setIsMobileOpen(false)}>
                  <UserPlus className='size-4' />
                  Get Started
                </Link>
              </Button>
            </>
          }
        </nav>

        {status === 'loading' ?
          <div className='border-sidebar-border border-t p-4'>
            <Skeleton className='h-10 w-full' />
          </div>
        : session?.user ?
          <div className='border-sidebar-border border-t p-4'>
            <Button
              variant='ghost'
              onClick={() => {
                setIsMobileOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className='hover:bg-sidebar-accent w-full justify-start gap-3 text-left text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400'
            >
              <LogOut className='size-4' />
              Log Out
            </Button>
          </div>
        : null}
      </aside>
    </>
  );
}
