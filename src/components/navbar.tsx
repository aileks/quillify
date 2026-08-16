'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import {
  BookOpen,
  Home,
  Info,
  ListIcon,
  LogIn,
  LogOut,
  Menu,
  Settings,
  User,
  UserPlus,
} from 'lucide-react';

import { NavLink } from '@/components/nav-link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

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
          <Skeleton className='h-9 w-9' />
        : <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                aria-label='Menu'
                className='border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground'
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              aria-describedby={undefined}
              className='border-sidebar-border bg-sidebar text-sidebar-foreground gap-0 p-0'
            >
              <div className='border-sidebar-border border-b px-4 py-4 pr-12'>
                <SheetTitle className='font-serif text-xl font-bold'>Quillify</SheetTitle>
                {session?.user && (
                  <div className='text-sidebar-foreground/80 mt-2 flex items-center gap-2 text-sm'>
                    <User className='size-4 shrink-0' />
                    <span className='truncate'>
                      {session.user.name || session.user.email || 'User'}
                    </span>
                  </div>
                )}
              </div>

              <nav className='flex flex-1 flex-col gap-1 p-2' aria-label='Menu'>
                {session?.user ?
                  <>
                    <NavLink
                      href='/'
                      icon={Home}
                      label='Home'
                      active={pathname === '/'}
                      onClick={closeMenu}
                      className='h-11'
                    />
                    <NavLink
                      href='/books'
                      icon={BookOpen}
                      label='Library'
                      active={pathname.startsWith('/books')}
                      onClick={closeMenu}
                      className='h-11'
                    />
                    <NavLink
                      href='/lists'
                      icon={ListIcon}
                      label='Lists'
                      active={pathname.startsWith('/lists')}
                      onClick={closeMenu}
                      className='h-11'
                    />
                    <NavLink
                      href='/account/settings'
                      icon={Settings}
                      label='Settings'
                      active={pathname === '/account/settings'}
                      onClick={closeMenu}
                      className='h-11'
                    />
                  </>
                : <>
                    <NavLink
                      href='/account/login'
                      icon={LogIn}
                      label='Log In'
                      active={pathname === '/account/login'}
                      onClick={closeMenu}
                      className='h-11'
                    />
                    <NavLink
                      href='/account/register'
                      icon={UserPlus}
                      label='Get Started'
                      active={pathname === '/account/register'}
                      onClick={closeMenu}
                      className='h-11'
                    />
                  </>
                }
              </nav>

              <footer className='border-sidebar-border flex flex-col gap-1 border-t p-2'>
                <NavLink
                  href='/about'
                  icon={Info}
                  label='About'
                  active={pathname === '/about'}
                  onClick={closeMenu}
                  className='h-11'
                />
                {session?.user && (
                  <Button
                    variant='ghost'
                    onClick={() => {
                      closeMenu();
                      signOut({ callbackUrl: '/' });
                    }}
                    className='text-sidebar-destructive hover:bg-sidebar-destructive/20! hover:text-sidebar-destructive dark:hover:bg-sidebar-destructive/20! h-11 w-full justify-start gap-3 text-left'
                  >
                    <LogOut />
                    Sign Out
                  </Button>
                )}
              </footer>
            </SheetContent>
          </Sheet>
        }
      </div>
    </nav>
  );
}
