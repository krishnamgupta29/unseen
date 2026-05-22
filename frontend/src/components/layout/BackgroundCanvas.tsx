'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const QUOTES = [
  "say what you can't say anywhere else.",
  "your identity is a shadow here.",
  "real thoughts. zero judgment.",
  "every soul has secrets.",
  "speak freely. disappear completely.",
  "the void listens. always.",
  "your voice, unmasked.",
  "be no one. say everything.",
];

const ORBS = [
  { cx: '15%',  cy: '20%', r: 180, color: 'rgba(123,44,191,0.12)',  dur: 14 },
  { cx: '80%',  cy: '70%', r: 220, color: 'rgba(56,189,248,0.07)',   dur: 18 },
  { cx: '50%',  cy: '85%', r: 160, color: 'rgba(167,139,250,0.09)',  dur: 12 },
  { cx: '90%',  cy: '10%', r: 140, color: 'rgba(236,72,153,0.07)',   dur: 20 },
  { cx: '10%',  cy: '75%', r: 130, color: 'rgba(99,102,241,0.10)',   dur: 16 },
];

export default function BackgroundCanvas() {
  const tickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 -z-0 pointer-events-none overflow-hidden">

      {/* === DOT GRID === */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, #7b2cbf 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* === DIAGONAL LINES (subtle) === */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #9d4edd 0, #9d4edd 1px, transparent 0, transparent 50%)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* === ANIMATED GLOW ORBS === */}
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: orb.cx,
            top: orb.cy,
            width: orb.r * 2,
            height: orb.r * 2,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
            x: [0, 20, -10, 0],
            y: [0, -15, 10, 0],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}

      {/* === FLOATING PARTICLES === */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`p${i}`}
          className="absolute rounded-full bg-unseen-400"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -(Math.random() * 80 + 40)],
          }}
          transition={{
            duration: Math.random() * 6 + 4,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* === SCROLLING QUOTE TICKER (bottom) === */}
      <div className="absolute bottom-0 left-0 right-0 h-10 flex items-center overflow-hidden border-t border-unseen-800/30 bg-[#080016]/40 backdrop-blur-sm">
        <motion.div
          className="flex whitespace-nowrap gap-24 text-xs font-mono text-unseen-600/60 uppercase tracking-widest"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {/* Duplicate for seamless loop */}
          {[...QUOTES, ...QUOTES].map((q, i) => (
            <span key={i}>✦ {q}</span>
          ))}
        </motion.div>
      </div>

    </div>
  );
}
