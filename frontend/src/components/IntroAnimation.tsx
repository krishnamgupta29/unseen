'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200); // total: ~2.2s
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden select-none"
      exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* === Central Radial Glow (behind the logo) === */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(157,78,221,0.45) 0%, rgba(123,44,191,0.15) 40%, transparent 70%)',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
      />

      {/* === Soft outer edge glow === */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(88,28,135,0.25) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />

      {/* === Logo === */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.h1
          className="font-poppins font-black text-white tracking-[0.4em] md:tracking-[0.6em]"
          style={{
            fontSize: 'clamp(3rem, 10vw, 7rem)',
            textShadow: '0 0 60px rgba(192,132,252,0.6), 0 0 120px rgba(157,78,221,0.3)',
            letterSpacing: '0.5em',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
        >
          UNSEEN
        </motion.h1>

        {/* Thin glowing underline */}
        <motion.div
          className="mt-3 rounded-full"
          style={{
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.8), transparent)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '80%', opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        />

        {/* Tagline */}
        <motion.p
          className="mt-5 font-inter text-center text-unseen-300/70 tracking-[0.2em] uppercase"
          style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.9rem)' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
        >
          Say it.&nbsp;&nbsp;Without being seen.
        </motion.p>
      </div>

      {/* === Corner vignette edges (ambient) === */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 120px 60px #000000',
        }}
      />
    </motion.div>
  );
}
