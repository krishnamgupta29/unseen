'use client';

import { useEffect, useState, useMemo } from 'react';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || 
           /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent) ||
           localStorage.getItem('isApk') === 'true';
  }, []);

  useEffect(() => {
    // Total duration of intro before exit starts: 1.2s (make it fast!)
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      // Let the fade-out CSS transition play for 300ms, then complete
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(completeTimer);
    }, 1200);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

  const letters = Array.from("UNSEEN");

  return (
    <>
      <style>{`
        .intro-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #000000;
          overflow: hidden;
          user-select: none;
          transition: opacity 0.3s ease-out, transform 0.3s ease-out;
          will-change: opacity, transform;
        }
        .intro-container.exiting {
          opacity: 0;
          transform: scale(1.02);
          pointer-events: none;
        }
        .intro-letter {
          display: inline-block;
          font-family: var(--font-poppins), sans-serif;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.1em;
          font-size: clamp(2.5rem, 8vw, 6.5rem);
          opacity: 0;
          animation: cssFadeInY 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          will-change: transform, opacity;
        }
        @media (min-width: 768px) {
          .intro-letter {
            letter-spacing: 0.2em;
            text-shadow: 0 0 20px rgba(192,132,252,0.6), 0 0 40px rgba(157,78,221,0.3);
          }
        }
        .intro-line {
          margin-top: 1rem;
          height: 1.5px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, rgba(192,132,252,0.6), transparent);
          opacity: 0;
          animation: cssScaleWidth 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-delay: 0.35s;
          will-change: width, opacity;
        }
        .intro-tagline {
          margin-top: 1.5rem;
          font-family: var(--font-inter), sans-serif;
          text-align: center;
          color: rgba(216, 180, 254, 0.8);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          font-size: clamp(0.6rem, 1.2vw, 0.8rem);
          opacity: 0;
          animation: cssFadeIn 0.4s ease-out forwards;
          animation-delay: 0.5s;
          will-change: opacity;
        }
        .intro-radial-glow {
          position: absolute;
          border-radius: 9999px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(157,78,221,0.25) 0%, rgba(123,44,191,0.06) 50%, transparent 70%);
          pointer-events: none;
        }
        .intro-outer-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(88,28,135,0.1) 100%);
          pointer-events: none;
        }
        .intro-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.95);
        }

        @keyframes cssFadeInY {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cssScaleWidth {
          from { width: 0; opacity: 0; }
          to { width: 70%; opacity: 1; }
        }
        @keyframes cssFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div className={`intro-container ${isExiting ? 'exiting' : ''}`}>
        {isMobile ? (
          /* Sleek, optimized simple layout for mobile to prevent any potential GPU stutter */
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="intro-letter" style={{ opacity: 1, animation: 'none' }}>
              UNSEEN
            </h1>
            <div className="mt-4 rounded-full" style={{ width: '70%', height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.4), transparent)' }} />
            <p className="mt-6 font-inter text-center text-purple-300/80 tracking-[0.2em] uppercase text-xs">
              Say it.&nbsp;&nbsp;Without being seen.
            </p>
          </div>
        ) : (
          /* Desktop layout with radial glows, letter stagger, etc. */
          <>
            <div className="intro-radial-glow" />
            <div className="intro-outer-glow" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex overflow-hidden">
                {letters.map((char, index) => (
                  <span
                    key={index}
                    className="intro-letter"
                    style={{ animationDelay: `${0.04 * index}s` }}
                  >
                    {char}
                  </span>
                ))}
              </div>
              <div className="intro-line" />
              <p className="intro-tagline">
                Say it.&nbsp;&nbsp;Without being seen.
              </p>
            </div>
            <div className="intro-vignette" />
          </>
        )}
      </div>
    </>
  );
}
