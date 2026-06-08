'use client';

import { useState, useEffect, useMemo } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [routeResolved, setRouteResolved] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAppContext();

  // Detect ONLY the native APK environment via the custom User-Agent flag set in MainActivity.kt
  // Regular mobile browsers (Chrome, Safari on mobile) are NOT treated as APK — they see the home page
  const isApk = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent;
    const isApkUA = ua.includes('UnseenAndroidAPK') || ua.includes('UnseenAPK');

    if (isApkUA) {
      // Persist so page reloads inside APK also know the context
      localStorage.setItem('isApk', 'true');
      return true;
    }

    // Clear stale flag — mobile browser visits should NOT be treated as APK
    localStorage.removeItem('isApk');
    return false;
  }, []);

  useEffect(() => {
    setIsHydrated(true);

    // Check if intro has played in the current tab session
    const sessionPlayed = sessionStorage.getItem('introPlayedSession');
    if (!sessionPlayed) {
      setShowIntro(true);
    }

    // Register Service Worker for PWA support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered successfully:', registration.scope);
        },
        (error) => {
          console.log('SW registration failed:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // Handle routing guards once hydrated and auth is resolved
    if (isHydrated && !authLoading) {
      if (!currentUser) {
        if (isApk) {
          // APK only: bypass landing page, send unauthenticated users straight to /login
          if (pathname !== '/login' && pathname !== '/signup' && pathname !== '/download') {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        } else {
          // Web (desktop + mobile browser): allow home page and public pages
          const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download'];
          const isAllowed = allowedPaths.some(
            path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/'))
          );
          if (!isAllowed) {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        }
      } else {
        // Authenticated users: redirect away from auth/landing pages to feed
        const authOrLandingPaths = ['/', '/login', '/signup'];
        if (authOrLandingPaths.includes(pathname)) {
          router.replace('/feed');
        } else {
          setRouteResolved(true);
        }
      }
    }
  }, [isHydrated, authLoading, currentUser, pathname, router, isApk]);

  // Mark route as resolved once pathname is at the correct destination
  useEffect(() => {
    if (isHydrated && !authLoading) {
      if (!currentUser && isApk && (pathname === '/login' || pathname === '/signup' || pathname === '/download')) {
        setRouteResolved(true);
      } else if (!currentUser && !isApk) {
        const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download'];
        const isAllowed = allowedPaths.some(
          path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/'))
        );
        if (isAllowed) setRouteResolved(true);
      } else if (currentUser && pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
        setRouteResolved(true);
      }
    }
  }, [pathname, isHydrated, authLoading, currentUser, isApk]);

  // Prevent flash of page content during hydration
  if (!isHydrated) {
    return <div className="fixed inset-0 z-[9999] bg-[#000000]" />;
  }

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayedSession', 'true');
    setShowIntro(false);
  };

  // Only hide content for APK until route resolves (prevents landing page flash before redirect to /login)
  const shouldHideContent = showIntro || (isApk && !routeResolved);

  return (
    <>
      {showIntro && (
        <IntroAnimation key="intro" onComplete={handleIntroComplete} />
      )}
      
      {/* Hide content while intro plays or APK route hasn't resolved yet */}
      <div className={shouldHideContent ? 'invisible h-0 overflow-hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
