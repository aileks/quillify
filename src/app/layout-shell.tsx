'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useCallback, useSyncExternalStore, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Sidebar, COLLAPSED_WIDTH } from '@/components/sidebar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 256;
const SIDEBAR_WIDTH_STORAGE_KEY = 'quillify-sidebar-width';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'quillify-sidebar-collapsed';
const VERIFICATION_TOAST_SHOWN_KEY = 'quillify-verification-toast-shown';
const VERIFICATION_BANNER_DISMISSED_KEY = 'quillify-verification-banner-dismissed';

// Read initial width from localStorage
function getStoredWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH;
  const stored = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
      return parsed;
    }
  }
  return SIDEBAR_DEFAULT_WIDTH;
}

// Read initial collapsed state from localStorage
function getStoredCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  return stored === 'true';
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
  const [isCollapsed, setIsCollapsed] = useState(getStoredCollapsed);
  const [isResizing, setIsResizing] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const toastShownRef = useRef(false);

  // Hide sidebar when logged out and on auth/landing pages
  const isLandingPage = pathname === '/';
  const isAuthPage =
    pathname.startsWith('/account/login') ||
    pathname.startsWith('/account/register') ||
    pathname.startsWith('/account/forgot-password') ||
    pathname.startsWith('/account/reset-password');
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const showSidebar = isAuthenticated || (!isLandingPage && !isAuthPage);

  // Check if user needs to verify email
  const needsVerification = isAuthenticated && session?.user?.emailVerified === false;
  const userEmail = session?.user?.email ?? '';
  const userId = session?.user?.id;

  // Show first-time verification toast (30 seconds, once per session per user)
  useEffect(() => {
    if (!needsVerification || !isHydrated || toastShownRef.current || !userId) return;

    // Use user-specific key to handle logout/login properly
    const toastKey = `${VERIFICATION_TOAST_SHOWN_KEY}-${userId}`;
    const alreadyShown = sessionStorage.getItem(toastKey) === 'true';
    if (alreadyShown) return;

    toastShownRef.current = true;
    sessionStorage.setItem(toastKey, 'true');

    toast.info(
      <div className='flex flex-col gap-2'>
        <span>Please verify your email address to unlock unlimited books.</span>
        <Link
          href='/account/settings#verification'
          className='text-primary underline underline-offset-2'
        >
          Go to Settings
        </Link>
      </div>,
      { duration: 30000 }
    );
  }, [needsVerification, isHydrated, userId]);

  // Handle banner dismissal (user-specific)
  const handleBannerDismiss = useCallback(() => {
    setBannerDismissed(true);
    if (userId) {
      sessionStorage.setItem(`${VERIFICATION_BANNER_DISMISSED_KEY}-${userId}`, 'true');
    }
  }, [userId]);

  // Show banner if: needs verification and not dismissed for this user
  const showVerificationBanner =
    isHydrated &&
    needsVerification &&
    !bannerDismissed &&
    (userId ?
      sessionStorage.getItem(`${VERIFICATION_BANNER_DISMISSED_KEY}-${userId}`) !== 'true'
    : true);

  // Persist width changes
  const handleWidthChange = useCallback((width: number) => {
    const clampedWidth = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
    setSidebarWidth(clampedWidth);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampedWidth));
  }, []);

  // Persist collapsed state changes
  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, []);

  // Calculate current sidebar width based on collapsed state
  const currentSidebarWidth = isCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

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
        style={{ left: showSidebar ? `${currentSidebarWidth + 16}px` : '16px' }}
      >
        Skip to main content
      </a>

      {/* Mobile navbar */}
      <Navbar className='md:hidden' />

      {/* Email verification banner */}
      {showVerificationBanner && (
        <div
          className='md:ml-[var(--sidebar-width)]'
          style={
            {
              '--sidebar-width': showSidebar ? `${currentSidebarWidth}px` : '0px',
            } as React.CSSProperties
          }
        >
          <EmailVerificationBanner email={userEmail} onDismiss={handleBannerDismiss} />
        </div>
      )}

      {/* Desktop sidebar */}
      {showSidebar && (
        <Sidebar
          className='hidden md:flex'
          width={sidebarWidth}
          onWidthChange={handleWidthChange}
          minWidth={SIDEBAR_MIN_WIDTH}
          maxWidth={SIDEBAR_MAX_WIDTH}
          isCollapsed={isCollapsed}
          onCollapsedChange={handleCollapsedChange}
          onResizingChange={setIsResizing}
        />
      )}

      {/* Main content area */}
      <main
        id='main-content'
        className={`min-h-screen ${!isResizing ? 'transition-[margin] duration-200 ease-out md:transition-[margin]' : ''}`}
        style={
          {
            // Only apply margin on md+ screens; CSS handles mobile reset
            '--sidebar-width': showSidebar ? `${currentSidebarWidth}px` : '0px',
          } as React.CSSProperties
        }
      >
        {children}
      </main>
    </>
  );
}
