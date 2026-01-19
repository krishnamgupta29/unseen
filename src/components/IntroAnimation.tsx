'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 5500),
      setTimeout(() => onComplete(), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-50 overflow-hidden"
          style={{ 
            height: '100dvh',
            minHeight: '-webkit-fill-available',
            background: 'linear-gradient(135deg, #0a0f1c 0%, #0c1628 50%, #0a1020 100%)',
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(800px,200vw)] h-[min(800px,200vw)]"
              style={{
                background: 'radial-gradient(circle, rgba(74, 124, 201, 0.15) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,150vw)] h-[min(600px,150vw)]"
              style={{
                background: 'radial-gradient(circle, rgba(59, 92, 168, 0.12) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1.2, 0.8, 1.2],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <div className="absolute inset-0 pointer-events-none">
            {[
              { left: 12, top: 8, delay: 0.2 },
              { left: 85, top: 15, delay: 1.4 },
              { left: 45, top: 22, delay: 0.8 },
              { left: 28, top: 78, delay: 1.1 },
              { left: 72, top: 85, delay: 0.5 },
              { left: 8, top: 45, delay: 1.8 },
              { left: 92, top: 52, delay: 0.3 },
              { left: 55, top: 68, delay: 1.6 },
              { left: 38, top: 35, delay: 0.9 },
              { left: 68, top: 42, delay: 1.2 },
              { left: 18, top: 92, delay: 0.6 },
              { left: 78, top: 28, delay: 1.0 },
              { left: 42, top: 58, delay: 0.4 },
              { left: 62, top: 72, delay: 1.5 },
              { left: 25, top: 18, delay: 0.7 },
              { left: 88, top: 88, delay: 1.3 },
              { left: 5, top: 65, delay: 0.1 },
              { left: 95, top: 38, delay: 1.7 },
              { left: 35, top: 5, delay: 0.55 },
              { left: 52, top: 95, delay: 1.9 },
            ].map((particle, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-[#4a7cc9]/40 rounded-full"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="relative z-10 text-center px-4">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 blur-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase >= 1 ? 0.4 : 0 }}
                  transition={{ duration: 2 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(74, 124, 201, 0.4) 0%, rgba(59, 92, 168, 0.4) 100%)',
                  }}
                />
                
                <motion.h1
                  className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-[0.2em] sm:tracking-[0.3em] relative"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ 
                    scale: phase >= 1 ? 1 : 0.9,
                    opacity: phase >= 1 ? 1 : 0 
                  }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {'UNSEEN'.split('').map((letter, index) => (
                    <motion.span
                      key={index}
                      className="inline-block"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.5,
                        filter: 'blur(20px)',
                      }}
                      animate={{ 
                        opacity: phase >= 1 ? 1 : 0,
                        scale: phase >= 1 ? 1 : 0.5,
                        filter: phase >= 1 ? 'blur(0px)' : 'blur(20px)',
                      }}
                      transition={{ 
                        duration: 1.2,
                        delay: index * 0.15,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #a0c4ff 0%, #7aa2e3 40%, #4a7cc9 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </motion.h1>
              </div>

              <motion.div
                className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: phase >= 2 ? 1 : 0,
                  scale: phase >= 2 ? 1 : 0.9,
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
              >
                <motion.div
                  className="w-8 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#4a7cc9]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: phase >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
                <span className="text-[#7a9fd4] text-xs sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap">
                  Say it. Without being seen.
                </span>
                <motion.div
                  className="w-8 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#4a7cc9]/50"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: phase >= 2 ? 1 : 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </motion.div>

              <motion.p
                className="mt-4 sm:mt-6 text-[#5a7ab0] text-sm sm:text-lg tracking-wide px-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: phase >= 3 ? 1 : 0,
                  scale: phase >= 3 ? 1 : 0.95,
                }}
                transition={{ duration: 1.5 }}
              >
                Where identity fades and truth emerges
              </motion.p>
            </div>
          </div>

          <motion.div
            className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 0.5 : 0 }}
            transition={{ duration: 1 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#4a7cc9]"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
