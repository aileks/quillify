'use client';

import Image from 'next/image';
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
  ListIcon,
  PanelLeftClose,
  PanelLeft,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/nav-link';
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
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Get sidebar state from store
  const { sidebarWidth, sidebarCollapsed, setSidebarWidth, setSidebarCollapsed } = useUIStore();

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

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const widthStep = event.shiftKey ? 32 : 8;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setSidebarWidth(sidebarWidth - widthStep);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setSidebarWidth(sidebarWidth + widthStep);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setSidebarWidth(SIDEBAR_MIN_WIDTH);
    } else if (event.key === 'End') {
      event.preventDefault();
      setSidebarWidth(SIDEBAR_MAX_WIDTH);
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground fixed top-0 left-0 z-50 flex h-screen flex-col border-r',
        // Only animate width when not actively resizing (e.g., collapse/expand)
        !isResizing && 'transition-[width] duration-200 ease-out',
        className
      )}
      style={{ width: `${currentWidth}px` }}
      aria-label='Sidebar navigation'
    >
      {/* Header */}
      <div className='border-sidebar-border flex flex-col border-b px-4 py-4'>
        <div
          className={cn('flex items-center justify-between', sidebarCollapsed && 'justify-center')}
        >
          {!sidebarCollapsed && (
            <Link
              href='/'
              className='text-sidebar-foreground flex min-w-0 items-center gap-2 font-serif text-xl font-bold'
              aria-label='Quillify home'
            >
              <Image
                src='/quill-logo.png'
                alt=''
                width={32}
                height={32}
                loading='eager'
                className='size-8 shrink-0'
              />
              <span className='truncate'>Quillify</span>
            </Link>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className='text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 w-8 shrink-0'
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ?
              <PanelLeft />
            : <PanelLeftClose />}
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
            <NavLink
              href='/'
              icon={Home}
              label='Home'
              active={pathname === '/'}
              iconOnly={sidebarCollapsed}
            />
            <NavLink
              href='/books'
              icon={BookOpen}
              label='Library'
              active={pathname.startsWith('/books')}
              iconOnly={sidebarCollapsed}
            />
            <NavLink
              href='/lists'
              icon={ListIcon}
              label='Lists'
              active={pathname.startsWith('/lists')}
              iconOnly={sidebarCollapsed}
            />
            <NavLink
              href='/account/settings'
              icon={Settings}
              label='Settings'
              active={pathname === '/account/settings'}
              iconOnly={sidebarCollapsed}
            />
          </>
        : <>
            <NavLink
              href='/account/login'
              icon={LogIn}
              label='Log In'
              active={pathname === '/account/login'}
              iconOnly={sidebarCollapsed}
            />
            <NavLink
              href='/account/register'
              icon={UserPlus}
              label='Get Started'
              active={pathname === '/account/register'}
              iconOnly={sidebarCollapsed}
            />
          </>
        }
      </nav>

      {/* Secondary navigation */}
      <footer className='border-sidebar-border flex flex-col gap-1 border-t p-2'>
        <NavLink
          href='/about'
          icon={Info}
          label='About'
          active={pathname === '/about'}
          iconOnly={sidebarCollapsed}
        />

        {session?.user && (
          <Button
            variant='ghost'
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'text-sidebar-destructive hover:bg-sidebar-destructive/20! hover:text-sidebar-destructive dark:hover:bg-sidebar-destructive/20! w-full justify-start gap-3 text-left',
              sidebarCollapsed && 'justify-center px-2'
            )}
            title={sidebarCollapsed ? 'Log Out' : undefined}
          >
            <LogOut />
            {!sidebarCollapsed && <span>Log Out</span>}
          </Button>
        )}
      </footer>

      {/* Resize handle - only show when not collapsed */}
      {!sidebarCollapsed && (
        <div
          data-slot='sidebar-resize-handle'
          className={cn(
            'hover:bg-sidebar-accent absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors',
            isResizing && 'bg-sidebar-accent'
          )}
          onMouseDown={handleResizeStart}
          onKeyDown={handleResizeKeyDown}
          role='separator'
          tabIndex={0}
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
