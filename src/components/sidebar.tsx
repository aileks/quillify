'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { BookOpen, LogIn, UserPlus, Settings, LogOut, User, Home } from 'lucide-react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useRef, useEffect, useState } from 'react';

interface SidebarProps {
  className?: string;
  width?: number;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function Sidebar({
  className,
  width = 256,
  onWidthChange,
  minWidth = 200,
  maxWidth = 360,
}: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const utils = api.useUtils();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

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

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!onWidthChange) return;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      onWidthChange(newWidth);
    },
    [onWidthChange, minWidth, maxWidth]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Start resizing
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-50 flex h-screen flex-col border-r font-serif',
        className
      )}
      style={{ width: `${width}px` }}
      aria-label='Sidebar navigation'
    >
      <div className='border-sidebar-border flex flex-col border-b px-6 py-4'>
        <div className='text-sidebar-foreground text-xl font-bold'>Quillify</div>
        {session?.user && (
          <div className='text-sidebar-foreground/80 mt-2 flex items-center gap-2 text-sm'>
            <User className='size-4' />
            {session.user.name || session.user.email || 'User'}
          </div>
        )}
      </div>

      <nav className='flex flex-1 flex-col gap-1 p-4'>
        {session?.user ?
          <>
            <div onMouseEnter={prefetchBooksData} onFocus={prefetchBooksData}>
              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname === '/' && 'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/'>
                  <Home className='size-4' />
                  Home
                </Link>
              </Button>
            </div>

            <div onMouseEnter={prefetchBooksData} onFocus={prefetchBooksData}>
              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname.startsWith('/books') &&
                    'bg-sidebar-accent text-sidebar-accent-foreground'
                )}
              >
                <Link href='/books'>
                  <BookOpen className='size-4' />
                  Books
                </Link>
              </Button>
            </div>

            <Button
              variant='ghost'
              asChild
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                pathname === '/account/settings' &&
                  'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <Link href='/account/settings'>
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
                pathname === '/account/login' && 'bg-sidebar-accent text-sidebar-accent-foreground'
              )}
            >
              <Link href='/account/login'>
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
              <Link href='/account/register'>
                <UserPlus className='size-4' />
                Get Started
              </Link>
            </Button>
          </>
        }
      </nav>

      {session?.user && (
        <div className='border-sidebar-border border-t p-4'>
          <Button
            variant='ghost'
            onClick={() => signOut({ callbackUrl: '/' })}
            className='hover:bg-sidebar-accent w-full justify-start gap-3 text-left text-red-600 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400'
          >
            <LogOut className='size-4' />
            Log Out
          </Button>
        </div>
      )}

      {/* Resize handle */}
      {onWidthChange && (
        <div
          data-slot='sidebar-resize-handle'
          className={cn(
            'hover:bg-sidebar-accent absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors',
            isResizing && 'bg-sidebar-accent'
          )}
          onMouseDown={handleResizeStart}
          role='separator'
          aria-orientation='vertical'
          aria-label='Resize sidebar'
          aria-valuenow={width}
          aria-valuemin={minWidth}
          aria-valuemax={maxWidth}
        />
      )}
    </aside>
  );
}
