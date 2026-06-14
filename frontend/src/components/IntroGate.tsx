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

    // Check if intro has played in the current tab session, or skip it in APK if already logged in
    const sessionPlayed = sessionStorage.getItem('introPlayedSession');
    const isApkUA = window.navigator.userAgent.includes('UnseenAndroidAPK') || window.navigator.userAgent.includes('UnseenAPK') || localStorage.getItem('isApk') === 'true';
    const hasToken = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');

    if (isApkUA && hasToken) {
      // In APK, if already logged in, skip the intro completely for instant loading
      setShowIntro(false);
      sessionStorage.setItem('introPlayedSession', 'true');
    } else if (!sessionPlayed) {
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
          const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download', '/faq'];
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
    // APK fast-path: if auth is still loading but we have a stored token,
    // immediately resolve the route so the user doesn't stare at a black screen
    // while the getMe() API call completes over the network.
    if (isHydrated && authLoading && isApk) {
      const hasToken = typeof window !== 'undefined' && 
        (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
      if (hasToken) {
        // User was previously logged in — show content immediately
        // If the token turns out invalid, the auth context will redirect to /login later
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
        const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download', '/faq'];
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
      
      {/* Hide content while intro plays — use opacity-0 NOT invisible, so the fixed WebGL canvas keeps rendering */}
      <div className={shouldHideContent ? 'opacity-0 h-0 overflow-hidden pointer-events-none' : 'contents'}>
        {children}
      </div>
    </>
  );
}
