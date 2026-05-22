'use client';

import { useState, useEffect } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import LandingPage from '@/components/LandingPage';
import { AnimatePresence } from 'framer-motion';

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    // Use localStorage to persist the played state permanently across refreshes and restarts
    const hasPlayed = localStorage.getItem('introPlayed');
    if (!hasPlayed) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    localStorage.setItem('introPlayed', 'true');
    setShowIntro(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#080016]">
      <AnimatePresence>
        {isHydrated && showIntro && (
          <IntroAnimation onComplete={handleIntroComplete} />
        )}
      </AnimatePresence>
      
      {(!isHydrated || !showIntro) && <LandingPage />}
    </main>
  );
}
