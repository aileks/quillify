'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  BookOpen,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  User,
  Home,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback, useRef, useEffect, useState } from 'react';
import { useUIStore, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from '@/stores';

interface SidebarProps {
  className?: string;
  onResizingChange?: (isResizing: boolean) => void;
}

export const COLLAPSED_WIDTH = 64;

export function Sidebar({ className, onResizingChange }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const utils = api.useUtils();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Get sidebar state from store
  const { sidebarWidth, sidebarCollapsed, setSidebarWidth, setSidebarCollapsed } = useUIStore();

  // Prefetch data on hover/focus for instant navigation
  const prefetchBooksData = () => {
    // Prefetch the default books list (page 1, sorted by title) - used by /books
    void utils.books.list.prefetch({
      page: 1,
      pageSize: 12,
      sortBy: 'title',
      sortOrder: 'asc',
    });
    // Prefetch stats data - used by home dashboard
    void utils.books.stats.prefetch();
  };

  // Handle mouse move during resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (sidebarCollapsed) return;
      const newWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    },
    [sidebarCollapsed, setSidebarWidth]
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    onResizingChange?.(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [onResizingChange]);

  // Start resizing
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (sidebarCollapsed) return;
      e.preventDefault();
      setIsResizing(true);
      onResizingChange?.(true);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarCollapsed, onResizingChange]
  );

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

  const currentWidth = sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-50 flex h-screen flex-col border-r font-serif',
        // Only animate width when not actively resizing (e.g., collapse/expand)
        !isResizing && 'transition-[width] duration-200 ease-out',
        className
      )}
      style={{ width: `${currentWidth}px` }}
      aria-label='Sidebar navigation'
    >
      {/* Header */}
      <div className='border-sidebar-border flex flex-col border-b px-4 py-4'>
        <div className='flex items-center justify-between'>
          {!sidebarCollapsed && (
            <div className='text-sidebar-foreground text-xl font-bold'>Quillify</div>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8 shrink-0',
              sidebarCollapsed && 'mx-auto'
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ?
              <PanelLeft className='size-4' />
            : <PanelLeftClose className='size-4' />}
          </Button>
        </div>
        {session?.user && !sidebarCollapsed && (
          <div className='text-sidebar-foreground/80 mt-2 flex items-center gap-2 text-sm'>
            <User className='size-4 shrink-0' />
            <span className='truncate'>{session.user.name || session.user.email || 'User'}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className='flex flex-1 flex-col gap-1 p-2'>
        {session?.user ?
          <>
            <div onMouseEnter={prefetchBooksData} onFocus={prefetchBooksData}>
              <Button
                variant='ghost'
                asChild
                className={cn(
                  'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                  pathname === '/' && 'bg-sidebar-accent text-sidebar-accent-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? 'Home' : undefined}
              >
                <Link href='/'>
                  <Home className='size-4 shrink-0' />
                  {!sidebarCollapsed && <span>Home</span>}
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
                    'bg-sidebar-accent text-sidebar-accent-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                title={sidebarCollapsed ? 'Books' : undefined}
              >
                <Link href='/books'>
                  <BookOpen className='size-4 shrink-0' />
                  {!sidebarCollapsed && <span>Books</span>}
                </Link>
              </Button>
            </div>

            <Button
              variant='ghost'
              asChild
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                pathname === '/account/settings' &&
                  'bg-sidebar-accent text-sidebar-accent-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <Link href='/account/settings'>
                <Settings className='size-4 shrink-0' />
                {!sidebarCollapsed && <span>Settings</span>}
              </Link>
            </Button>
          </>
        : <>
            <Button
              variant='ghost'
              asChild
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                pathname === '/account/login' && 'bg-sidebar-accent text-sidebar-accent-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? 'Log In' : undefined}
            >
              <Link href='/account/login'>
                <LogIn className='size-4 shrink-0' />
                {!sidebarCollapsed && <span>Log In</span>}
              </Link>
            </Button>

            <Button
              variant='ghost'
              asChild
              className={cn(
                'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3 text-left',
                pathname === '/account/register' &&
                  'bg-sidebar-accent text-sidebar-accent-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )}
              title={sidebarCollapsed ? 'Get Started' : undefined}
            >
              <Link href='/account/register'>
                <UserPlus className='size-4 shrink-0' />
                {!sidebarCollapsed && <span>Get Started</span>}
              </Link>
            </Button>
          </>
        }
      </nav>

      {/* Footer - Logout */}
      {session?.user && (
        <div className='border-sidebar-border border-t p-2'>
          <Button
            variant='ghost'
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'w-full justify-start gap-3 text-left text-red-400 hover:text-red-700',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? 'Log Out' : undefined}
          >
            <LogOut className='size-4 shrink-0' />
            {!sidebarCollapsed && <span>Log Out</span>}
          </Button>
        </div>
      )}

      {/* Resize handle - only show when not collapsed */}
      {!sidebarCollapsed && (
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
          aria-valuenow={sidebarWidth}
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
        />
      )}
    </aside>
  );
}
