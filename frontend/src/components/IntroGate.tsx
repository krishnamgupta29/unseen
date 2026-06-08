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

  // Detect mobile device or APK environment immediately and persistently
  const isMobileOrApk = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const uaMatch = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
                     window.navigator.userAgent.includes('UnseenAndroidAPK') || 
                     window.navigator.userAgent.includes('UnseenAPK');
    const storageMatch = localStorage.getItem('isApk') === 'true' || localStorage.getItem('isMobile') === 'true';
    const screenMatch = window.innerWidth < 768;
    
    if (uaMatch && !storageMatch) {
      localStorage.setItem('isApk', 'true');
    }
    return uaMatch || storageMatch || screenMatch;
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
        if (isMobileOrApk) {
          // Mobile/APK: always redirect unauthenticated users to /login (no landing page)
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        } else {
          // Desktop Web: unauthenticated users can access /, /login, /signup, /about, /privacy, /terms, /contact
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
  }, [isHydrated, authLoading, currentUser, pathname, router, isMobileOrApk]);

  // Mark route as resolved once pathname changes to the target destination
  useEffect(() => {
    if (isHydrated && !authLoading) {
      if (!currentUser && isMobileOrApk && (pathname === '/login' || pathname === '/signup')) {
        setRouteResolved(true);
      } else if (!currentUser && !isMobileOrApk) {
        const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact'];
        const isAllowed = allowedPaths.some(path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/')));
        if (isAllowed) setRouteResolved(true);
      } else if (currentUser && pathname !== '/' && pathname !== '/login' && pathname !== '/signup') {
        setRouteResolved(true);
      }
    }
  }, [pathname, isHydrated, authLoading, currentUser, isMobileOrApk]);

  // Prevent flash of page content during hydration
  if (!isHydrated) {
    return <div className="fixed inset-0 z-[9999] bg-[#000000]" />;
  }

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayedSession', 'true');
    setShowIntro(false);
  };

  // For mobile/APK users: hide children completely until route is resolved (prevents landing page flash)
  const shouldHideContent = showIntro || (isMobileOrApk && !routeResolved);

  return (
    <>
      {showIntro && (
        <IntroAnimation key="intro" onComplete={handleIntroComplete} />
      )}
      
      {/* Hide content while intro is playing or route hasn't resolved (Mobile/APK) */}
      <div className={shouldHideContent ? 'invisible h-0 overflow-hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
