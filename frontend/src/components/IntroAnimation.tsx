'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const isApk = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.navigator.userAgent.includes('UnseenAndroidAPK') || 
           window.navigator.userAgent.includes('UnseenAPK') ||
           localStorage.getItem('isApk') === 'true';
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200); // 2.2s duration so user can read the logo and tagline
    return () => clearTimeout(timer);
  }, [onComplete]);

  const letters = Array.from("UNSEEN");

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden select-none"
      exit={{ opacity: 0, scale: 1.02, transition: { duration: 0.4, ease: 'easeOut' } }}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Render simple, high-performance elements for mobile/APK to prevent hanging */}
      {isApk ? (
        <div className="relative z-10 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="font-poppins font-black text-white tracking-[0.1em] font-sans"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
            }}
          >
            UNSEEN
          </motion.h1>

          {/* Static thin line */}
          <div
            className="mt-4 rounded-full"
            style={{
              width: '70%',
              height: 1.5,
              background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.4), transparent)',
            }}
          />

          {/* Simple tagline fade */}
          <motion.p
            className="mt-6 font-inter text-center text-purple-300/80 tracking-[0.2em] uppercase text-xs"
            style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          >
            Say it.&nbsp;&nbsp;Without being seen.
          </motion.p>
        </div>
      ) : (
        <>
          {/* === Central Radial Glow (behind the logo) === */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 320,
              height: 320,
              background: 'radial-gradient(circle, rgba(157,78,221,0.25) 0%, rgba(123,44,191,0.06) 50%, transparent 70%)',
            }}
          />

          {/* === Soft outer edge glow === */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(88,28,135,0.1) 100%)',
            }}
          />

          {/* === Logo === */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex overflow-hidden">
              {letters.map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0
                  }}
                  transition={{
                    opacity: { duration: 0.35, delay: 0.04 * index, ease: 'easeOut' },
                    y: { duration: 0.35, delay: 0.04 * index, ease: 'easeOut' }
                  }}
                  className="font-poppins font-black text-white tracking-[0.1em] md:tracking-[0.2em] inline-block font-sans"
                  style={{
                    fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
                    textShadow: '0 0 20px rgba(192,132,252,0.6), 0 0 40px rgba(157,78,221,0.3)',
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </div>

            {/* Thin glowing underline */}
            <motion.div
              className="mt-4 rounded-full"
              style={{
                height: 1.5,
                background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.6), transparent)',
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '70%', opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.35, ease: 'easeOut' }}
            />

            {/* Tagline */}
            <motion.p
              className="mt-6 font-inter text-center text-purple-300/80 tracking-[0.25em] uppercase text-xs"
              style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)' }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
            >
              Say it.&nbsp;&nbsp;Without being seen.
            </motion.p>
          </div>

          {/* === Corner vignette edges (ambient) === */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]" />
        </>
      )}
    </motion.div>
  );
}
