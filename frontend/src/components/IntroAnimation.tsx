'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // 2 seconds max duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  const letters = Array.from("UNSEEN");

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#000000] overflow-hidden select-none"
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] } }}
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* === Central Radial Glow (behind the logo) === */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(157,78,221,0.4) 0%, rgba(123,44,191,0.12) 40%, transparent 70%)',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* === Soft outer edge glow === */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(88,28,135,0.18) 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* === Logo === */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex overflow-hidden">
          {letters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.7,
                delay: 0.1 * index,
                ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
              }}
              className="font-poppins font-black text-white tracking-[0.1em] md:tracking-[0.2em] inline-block font-sans"
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 6.5rem)',
                textShadow: '0 0 40px rgba(192,132,252,0.65), 0 0 80px rgba(157,78,221,0.3)',
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
            background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.7), transparent)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '80%', opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease: 'easeOut' }}
        />

        {/* Tagline */}
        <motion.p
          className="mt-6 font-inter text-center text-unseen-300/80 tracking-[0.25em] uppercase text-xs"
          style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.8rem)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: 'easeOut' }}
        >
          Say it.&nbsp;&nbsp;Without being seen.
        </motion.p>
      </div>

      {/* === Corner vignette edges (ambient) === */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.95)]" />
    </motion.div>
  );
}
