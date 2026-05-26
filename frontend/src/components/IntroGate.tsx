'use client';

import { useState, useEffect } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import { AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAppContext();

  useEffect(() => {
    // Check if intro has played
    const hasPlayed = localStorage.getItem('introPlayed');
    if (!hasPlayed) {
      setShowIntro(true);
    }
    setIsLoading(false);

    // Register Service Worker for PWA support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered successfully:', registration.scope);
        },
        (error) => {
          console.error('SW registration failed:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    // If the intro has played or completed, handle APK redirection
    if (!isLoading && !showIntro && !authLoading) {
      const isApk = typeof window !== 'undefined' && 
        (window.navigator.userAgent.includes('UnseenAPK') || localStorage.getItem('isApk') === 'true');
      
      if (isApk) {
        localStorage.setItem('isApk', 'true');
        
        if (!currentUser) {
          if (pathname !== '/login' && pathname !== '/signup') {
            router.replace('/login');
          }
        } else if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
          router.replace('/feed');
        }
      } else {
        // Web flow: redirect logged in users away from auth / landing page to feed
        if (currentUser && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
          router.replace('/feed');
        }
      }
    }
  }, [isLoading, showIntro, authLoading, currentUser, pathname, router]);

  if (isLoading) {
    return <div className="fixed inset-0 z-[9999] bg-[#080016]" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showIntro && (
          <IntroAnimation key="intro" onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>
      
      {/* Hide content while intro is playing to prevent background interactions or audio */}
      <div className={showIntro ? 'invisible h-0 overflow-hidden' : 'contents'}>
        {children}
      </div>
    </>
  );
}
