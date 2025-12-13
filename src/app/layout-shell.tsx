'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Sidebar, COLLAPSED_WIDTH } from '@/components/sidebar';
import { EmailVerificationBanner } from '@/components/email-verification-banner';
import {
  useUIStore,
  useUIStoreHydrated,
  useVerificationStore,
  useNotificationStore,
} from '@/stores';

interface LayoutShellProps {
  children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isResizing, setIsResizing] = useState(false);

  // UI Store - for sidebar dimensions
  const { sidebarWidth, sidebarCollapsed } = useUIStore();
  const hasHydrated = useUIStoreHydrated();

  // Verification Store - for toast/banner flow
  const { shouldShowToast, shouldShowBanner, markToastShown, setToastPending, dismissBanner } =
    useVerificationStore();

  // Notification Store - for ephemeral notifications
  const { accountDeleted, clearAccountDeleted } = useNotificationStore();

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

  // Show account deleted toast (after redirect from account deletion)
  useEffect(() => {
    if (!hasHydrated) return;

    if (accountDeleted) {
      clearAccountDeleted();
      toast.success('Your account has been deleted');
    }
  }, [hasHydrated, accountDeleted, clearAccountDeleted]);

  // Show first-login verification toast (only on very first login)
  useEffect(() => {
    if (!needsVerification || !hasHydrated || !userId) return;
    if (!shouldShowToast(userId)) return;

    setToastPending(userId, true);

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
      {
        duration: 30000,
        onDismiss: () => {
          markToastShown(userId);
        },
        onAutoClose: () => {
          markToastShown(userId);
        },
      }
    );
  }, [needsVerification, hasHydrated, userId, shouldShowToast, setToastPending, markToastShown]);

  // Handle banner dismissal
  const handleBannerDismiss = () => {
    if (userId) {
      dismissBanner(userId);
    }
  };

  // Calculate current sidebar width based on collapsed state
  const currentSidebarWidth = sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth;

  // Show verification banner if conditions are met
  const showVerificationBanner =
    hasHydrated && userId ? shouldShowBanner(userId, needsVerification) : false;

  // Prevent layout shift before hydration
  if (!hasHydrated) {
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
      {showSidebar && <Sidebar className='hidden md:flex' onResizingChange={setIsResizing} />}

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
