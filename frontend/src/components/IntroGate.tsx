'use client';

import { useState, useEffect, useMemo } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import { usePathname, useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [routeResolved, setRouteResolved] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
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

    // Check if intro has played
    const introPlayed = localStorage.getItem('introPlayed');
    if (!introPlayed) {
      setShowIntro(true);
    }

    // Version check for native Android APK
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isApkUA = ua.includes('UnseenAndroidAPK');
      if (isApkUA) {
        const match = ua.match(/UnseenAndroidAPK\/([0-9.]+)/);
        // If no version found in UA, it's a pre-versioning (old) APK → treat as '0.0' so it always triggers the update alert
        const currentVersion = match ? match[1] : '0.0';

        fetch('/app-version.json')
          .then(res => res.json())
          .then(data => {
            if (data && data.version && data.version !== currentVersion) {
              const dismissed = sessionStorage.getItem('dismissedUpdate');
              if (dismissed !== data.version) {
                setUpdateNotes(data.releaseNotes || '');
                setShowUpdateModal(true);
              }
            }
          })
          .catch(err => console.error('Failed to check app version', err));
      }
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

  const normalizedPath = useMemo(() => {
    if (!pathname) return '';
    return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  }, [pathname]);

  useEffect(() => {
    // Handle routing guards once hydrated and auth is resolved
    if (isHydrated && !authLoading) {
      if (!currentUser) {
        if (isApk) {
          // APK only: bypass landing page, send unauthenticated users straight to /login
          if (normalizedPath !== '/login' && normalizedPath !== '/signup' && normalizedPath !== '/download') {
            router.replace('/login');
          } else {
            setRouteResolved(true);
          }
        } else {
          // Web (desktop + mobile browser): allow home page and public pages
          const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download', '/faq'];
          const isAllowed = allowedPaths.some(
            path => normalizedPath === path || (path !== '/' && normalizedPath?.startsWith(path + '/'))
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
        if (authOrLandingPaths.includes(normalizedPath)) {
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
        if (authOrLandingPaths.includes(normalizedPath)) {
          router.replace('/feed');
        } else {
          setRouteResolved(true);
        }
      }
    }
  }, [isHydrated, authLoading, currentUser, normalizedPath, router, isApk]);

  // Mark route as resolved once pathname is at the correct destination
  useEffect(() => {
    if (isHydrated && !authLoading) {
      if (!currentUser && isApk && (normalizedPath === '/login' || normalizedPath === '/signup' || normalizedPath === '/download')) {
        setRouteResolved(true);
      } else if (!currentUser && !isApk) {
        const allowedPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download', '/faq'];
        const isAllowed = allowedPaths.some(
          path => normalizedPath === path || (path !== '/' && normalizedPath?.startsWith(path + '/'))
        );
        if (isAllowed) setRouteResolved(true);
      } else if (currentUser && normalizedPath !== '/' && normalizedPath !== '/login' && normalizedPath !== '/signup') {
        setRouteResolved(true);
      }
    }
  }, [normalizedPath, isHydrated, authLoading, currentUser, isApk]);

  const handleIntroComplete = () => {
    localStorage.setItem('introPlayed', 'true');
    setShowIntro(false);
  };

  // Only hide content until intro complete and route resolved
  const shouldHideContent = showIntro || !routeResolved;

  return (
    <>
      {/* Fallback styling for when Javascript is disabled. It overrides the hiding classes and overlays */}
      <noscript>
        <style dangerouslySetInnerHTML={{ __html: `
          .noscript-hidden-content {
            opacity: 1 !important;
            height: auto !important;
            overflow: visible !important;
            pointer-events: auto !important;
          }
          .noscript-hide {
            display: none !important;
          }
        `}} />
      </noscript>

      {/* Before hydration, show a black screen overlay to prevent flash of content */}
      {!isHydrated && (
        <div className="fixed inset-0 z-[9999] bg-[#080016] noscript-hide" />
      )}

      {showIntro && (
        <IntroAnimation key="intro" onComplete={handleIntroComplete} />
      )}
      
      {/* Keep children in DOM so it is pre-rendered for search engines. Hiding classes are overridden if JS is disabled. */}
      <div className={(!isHydrated || shouldHideContent) ? 'opacity-0 h-0 overflow-hidden pointer-events-none noscript-hidden-content' : 'contents'}>
        {children}
      </div>

      {!showIntro && showUpdateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative w-full max-w-sm glass bg-[#0a0216]/90 border border-unseen-800/60 rounded-3xl p-6 md:p-8 z-10 shadow-[0_0_50px_rgba(157,78,221,0.25)] text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unseen-500 via-purple-500 to-unseen-500" />
            <div className="mx-auto w-12 h-12 bg-unseen-500/10 rounded-full flex items-center justify-center mb-4 border border-unseen-500/20">
              <svg className="w-6 h-6 text-unseen-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-poppins mb-2">App Update Available</h3>
            <p className="text-sm text-gray-400 font-inter leading-relaxed mb-4">
              A new version of the Unseen native app is available. Please download the update to get the latest features and stability improvements.
            </p>
            {updateNotes && (
              <div className="text-xs text-gray-500 bg-[#120524]/60 border border-unseen-900/30 rounded-xl p-3 mb-6 text-left font-inter max-h-24 overflow-y-auto leading-relaxed">
                <span className="font-semibold text-unseen-300 block mb-1">What's New:</span>
                {updateNotes}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  window.location.href = '/download/';
                }}
                className="flex-1 py-3 bg-gradient-to-r from-unseen-600 to-purple-650 hover:shadow-[0_0_20px_rgba(123,44,191,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white cursor-pointer"
              >
                Update Now
              </button>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  fetch('/app-version.json')
                    .then(res => res.json())
                    .then(data => {
                      if (data && data.version) {
                        sessionStorage.setItem('dismissedUpdate', data.version);
                      }
                    });
                }}
                className="px-4 py-3 bg-unseen-950/40 hover:bg-unseen-900/40 border border-unseen-800/40 transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-gray-400 cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
