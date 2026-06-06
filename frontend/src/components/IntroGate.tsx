'use client';

import { useState, useEffect, useMemo } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import { AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [routeResolved, setRouteResolved] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAppContext();

  // Detect APK environment immediately and persistently
  const isApk = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = window.navigator.userAgent.includes('UnseenAndroidAPK') || 
                     window.navigator.userAgent.includes('UnseenAPK');
    const storageMatch = localStorage.getItem('isApk') === 'true';
    if (uaMatch && !storageMatch) {
      localStorage.setItem('isApk', 'true');
    }
    return uaMatch || storageMatch;
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
    // Handle routing guards immediately once hydrated and auth is loaded
    // This runs even while intro is playing, so the correct page is loaded underneath
    if (isHydrated && !authLoading) {
      // Unified Auth Guard for both Web and APK
      if (!currentUser) {
        if (isApk) {
          // APK: always redirect unauthenticated users to /login (no landing page)
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        } else {
          // Web: unauthenticated users can access /, /login, /signup, /about, /privacy, /terms, /contact
          const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact'];
          const isAllowed = allowedPaths.some(path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/')));
          if (!isAllowed) {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        }
      } else {
        // Authenticated users should be redirected from auth / landing pages to /feed
        const authOrLandingPaths = ['/', '/login', '/signup'];
        if (authOrLandingPaths.includes(pathname)) {
          router.replace('/feed');
        } else {
          setRouteResolved(true);
        }
      }
    }
  }, [isHydrated, authLoading, currentUser, pathname, router, isApk]);

  // Mark route as resolved once pathname changes to the target destination
  useEffect(() => {
    if (isHydrated && !authLoading) {
      if (!currentUser && isApk && (pathname === '/login' || pathname === '/signup')) {
        setRouteResolved(true);
      } else if (!currentUser && !isApk) {
        const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact'];
        const isAllowed = allowedPaths.some(path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/')));
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

  // For APK users: hide children completely until route is resolved (prevents landing page flash)
  const shouldHideContent = showIntro || (isApk && !routeResolved);

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>
      
      {/* Hide content while intro is playing or route hasn't resolved (APK) */}
      <div className={shouldHideContent ? 'invisible h-0 overflow-hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
