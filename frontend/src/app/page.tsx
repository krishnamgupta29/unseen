'use client';

import { useState, useEffect } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import LandingPage from '@/components/LandingPage';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const [showIntro, setShowIntro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem('introPlayed') || localStorage.getItem('introPlayed');
    if (!hasPlayed) {
      setShowIntro(true);
    }
    setIsLoading(false);
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem('introPlayed', 'true');
    localStorage.setItem('introPlayed', 'true');
    setShowIntro(false);
  };

  if (isLoading) {
    return <main className="flex min-h-screen flex-col bg-[#080016]" />;
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#080016]">
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroAnimation key="intro" onComplete={handleIntroComplete} />
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full"
          >
            <LandingPage />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
