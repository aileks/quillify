'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useCallback, useSyncExternalStore } from 'react';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_STORAGE_KEY = 'quillify-sidebar-width';

// Read initial width from localStorage
function getStoredWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH;
  const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
      return parsed;
    }
  }
  return SIDEBAR_DEFAULT_WIDTH;
}

// useSyncExternalStore subscription for hydration detection
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHydrated = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const [sidebarWidth, setSidebarWidth] = useState(getStoredWidth);

  // Hide sidebar when logged out and on auth/landing pages
  const isLandingPage = pathname === '/';
  const isAuthPage =
    pathname.startsWith('/account/login') || pathname.startsWith('/account/register');
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const showSidebar = isAuthenticated || (!isLandingPage && !isAuthPage);

  // Persist width changes
  const handleWidthChange = useCallback((width: number) => {
    const clampedWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
    setSidebarWidth(clampedWidth);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(clampedWidth));
  }, []);

  // Prevent layout shift before hydration
  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {/* Skip to main content link */}
      <a
        href='#main-content'
        className='focus:bg-primary focus:text-primary-foreground focus-visible:ring-ring focus:rounded-sm-md sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
        style={{ left: showSidebar ? `${sidebarWidth + 16}px` : '16px' }}
      >
        Skip to main content
      </a>

      {/* Mobile navbar */}
      <Navbar className='md:hidden' />

      {/* Desktop sidebar */}
      {showSidebar && (
        <Sidebar
          className='hidden md:flex'
          width={sidebarWidth}
          onWidthChange={handleWidthChange}
          minWidth={SIDEBAR_MIN_WIDTH}
          maxWidth={SIDEBAR_MAX_WIDTH}
        />
      )}

      {/* Main content area */}
      <main
        id='main-content'
        className='min-h-screen transition-[margin] duration-150 ease-out md:transition-[margin]'
        style={
          {
            // Only apply margin on md+ screens; CSS handles mobile reset
            '--sidebar-width': showSidebar ? `${sidebarWidth}px` : '0px',
          } as React.CSSProperties
        }
      >
        {children}
      </main>
    </>
  );
}
