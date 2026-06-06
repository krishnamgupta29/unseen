'use client';

import { useState, useEffect } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import { AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAppContext();

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
    // If the intro has played or completed, handle routing guards
    if (isHydrated && !showIntro && !authLoading) {
      const isApk = typeof window !== 'undefined' && 
        (window.navigator.userAgent.includes('UnseenAndroidAPK') || 
         window.navigator.userAgent.includes('UnseenAPK') || 
         localStorage.getItem('isApk') === 'true');
      
      if (isApk) {
        localStorage.setItem('isApk', 'true');
      }

      // Unified Auth Guard for both Web and APK
      if (!currentUser) {
        if (isApk && pathname === '/') {
          router.replace('/login');
        } else {
          // Unauthenticated users can only access /, /login, /signup, /about, /privacy, /terms, /contact
          const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact'];
          const isAllowed = allowedPaths.some(path => pathname === path || (path !== '/' && pathname?.startsWith(path + '/')));
          if (!isAllowed) {
            router.replace('/login');
          }
        }
      } else {
        // Authenticated users should be redirected from auth / landing pages to /feed
        const authOrLandingPaths = ['/', '/login', '/signup'];
        if (authOrLandingPaths.includes(pathname)) {
          router.replace('/feed');
        }
      }
    }
  }, [isHydrated, showIntro, authLoading, currentUser, pathname, router]);

  // Prevent flash of page content during hydration
  if (!isHydrated) {
    return <div className="fixed inset-0 z-[9999] bg-[#000000]" />;
  }

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayedSession', 'true');
    setShowIntro(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation key="intro" onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>
      
      {/* Hide content while intro is playing to prevent background interactions or audio */}
      <div className={showIntro ? 'invisible h-0 overflow-hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
