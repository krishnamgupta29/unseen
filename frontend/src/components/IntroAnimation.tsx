'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// ─── Particle System ───────────────────────────────────────────────

interface Vector2D {
  x: number;
  y: number;
}

class Particle {
  pos: Vector2D = { x: 0, y: 0 };
  vel: Vector2D = { x: 0, y: 0 };
  acc: Vector2D = { x: 0, y: 0 };
  target: Vector2D = { x: 0, y: 0 };

  closeEnoughTarget = 100;
  maxSpeed = 1.0;
  maxForce = 0.1;
  particleSize = 10;
  isKilled = false;

  startColor = { r: 0, g: 0, b: 0 };
  targetColor = { r: 0, g: 0, b: 0 };
  colorWeight = 0;
  colorBlendRate = 0.01;

  move() {
    let proximityMult = 1;
    const distance = Math.sqrt(
      Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2)
    );

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget;
    }

    const towardsTarget = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    };

    const magnitude = Math.sqrt(
      towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y
    );
    if (magnitude > 0) {
      towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
      towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
    }

    const steer = {
      x: towardsTarget.x - this.vel.x,
      y: towardsTarget.y - this.vel.y,
    };

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce;
      steer.y = (steer.y / steerMagnitude) * this.maxForce;
    }

    this.acc.x += steer.x;
    this.acc.y += steer.y;

    this.vel.x += this.acc.x;
    this.vel.y += this.acc.y;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    this.acc.x = 0;
    this.acc.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
    }

    const currentColor = {
      r: Math.round(
        this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight
      ),
      g: Math.round(
        this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight
      ),
      b: Math.round(
        this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight
      ),
    };

    ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
    ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
  }

  kill(width: number, height: number) {
    if (!this.isKilled) {
      const randomPos = this.generateRandomPos(width / 2, height / 2, (width + height) / 2);
      this.target.x = randomPos.x;
      this.target.y = randomPos.y;

      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      };
      this.targetColor = { r: 0, g: 0, b: 0 };
      this.colorWeight = 0;

      this.isKilled = true;
    }
  }

  private generateRandomPos(x: number, y: number, mag: number): Vector2D {
    const randomX = Math.random() * 1000;
    const randomY = Math.random() * 500;

    const direction = {
      x: randomX - x,
      y: randomY - y,
    };

    const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (magnitude > 0) {
      direction.x = (direction.x / magnitude) * mag;
      direction.y = (direction.y / magnitude) * mag;
    }

    return {
      x: x + direction.x,
      y: y + direction.y,
    };
  }
}

// ─── Intro Animation Component ────────────────────────────────────

// The purple palette from the Unseen design system
const UNSEEN_PURPLE_COLORS = [
  { r: 192, g: 132, b: 252 }, // purple-400
  { r: 157, g: 78, b: 221 },  // purple-500 (unseen-400)
  { r: 199, g: 125, b: 255 }, // unseen-300
  { r: 224, g: 170, b: 255 }, // unseen-200
  { r: 123, g: 44, b: 191 },  // unseen-500
];

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const hasInitRef = useRef(false);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent) ||
      localStorage.getItem('isApk') === 'true'
    );
  }, []);

  const generateRandomPos = useCallback(
    (x: number, y: number, mag: number): Vector2D => {
      const randomX = Math.random() * 1000;
      const randomY = Math.random() * 500;

      const direction = { x: randomX - x, y: randomY - y };
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      if (magnitude > 0) {
        direction.x = (direction.x / magnitude) * mag;
        direction.y = (direction.y / magnitude) * mag;
      }
      return { x: x + direction.x, y: y + direction.y };
    },
    []
  );

  const spawnWord = useCallback(
    (word: string, canvas: HTMLCanvasElement) => {
      const offscreen = document.createElement('canvas');
      // Scale down the offscreen canvas to optimize pixel scanning on mobile/APK
      const scale = isMobile ? 0.2 : 0.4;
      offscreen.width = Math.round(canvas.width * scale);
      offscreen.height = Math.round(canvas.height * scale);
      const offCtx = offscreen.getContext('2d')!;

      // Font size scales with scaled offscreen canvas width
      const fontSize = Math.round(offscreen.width * (isMobile ? 0.14 : 0.12));
      offCtx.fillStyle = 'white';
      offCtx.font = `900 ${fontSize}px Arial, sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(word, offscreen.width / 2, offscreen.height / 2);

      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const pixels = imageData.data;
      const pixelSteps = isMobile ? 2 : 1;

      // Pick a random purple from the palette
      const newColor =
        UNSEEN_PURPLE_COLORS[Math.floor(Math.random() * UNSEEN_PURPLE_COLORS.length)];

      const particles = particlesRef.current;
      let particleIndex = 0;

      // Collect pixel coordinates
      const coordsIndexes: number[] = [];
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i);
      }

      // Shuffle for fluid particle motion
      for (let i = coordsIndexes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]];
      }

      for (const coordIndex of coordsIndexes) {
        const alpha = pixels[coordIndex + 3];
        if (alpha > 0) {
          // Map coordinates back to the full-screen canvas scale
          const x = ((coordIndex / 4) % offscreen.width) / scale;
          const y = Math.floor(coordIndex / 4 / offscreen.width) / scale;

          let particle: Particle;
          if (particleIndex < particles.length) {
            particle = particles[particleIndex];
            particle.isKilled = false;
            particleIndex++;
          } else {
            particle = new Particle();
            const randomPos = generateRandomPos(
              canvas.width / 2,
              canvas.height / 2,
              (canvas.width + canvas.height) / 2
            );
            particle.pos.x = randomPos.x;
            particle.pos.y = randomPos.y;
            // Native APK performance tuning for speeds/sizes
            particle.maxSpeed = isMobile ? (Math.random() * 4 + 5) : (Math.random() * 6 + 8);
            particle.maxForce = particle.maxSpeed * 0.08;
            particle.particleSize = isMobile ? (Math.random() * 3 + 3) : (Math.random() * 6 + 6);
            particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;
            particles.push(particle);
          }

          particle.startColor = {
            r:
              particle.startColor.r +
              (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
            g:
              particle.startColor.g +
              (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
            b:
              particle.startColor.b +
              (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
          };
          particle.targetColor = newColor;
          particle.colorWeight = 0;
          particle.target.x = x;
          particle.target.y = y;
        }
      }

      // Kill remaining particles
      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(canvas.width, canvas.height);
      }
    },
    [isMobile, generateRandomPos]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Full-screen canvas — matches the viewport exactly
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    if (hasInitRef.current) return;
    hasInitRef.current = true;

    // Spawn "UNSEEN" immediately
    spawnWord('UNSEEN', canvas);

    // Animation loop
    const animate = () => {
      const ctx = canvas.getContext('2d')!;
      const particles = particlesRef.current;

      // Motion-blur background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.move();
        particle.draw(ctx);

        if (particle.isKilled) {
          if (
            particle.pos.x < 0 ||
            particle.pos.x > canvas.width ||
            particle.pos.y < 0 ||
            particle.pos.y > canvas.height
          ) {
            particles.splice(i, 1);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    let completeTimer: NodeJS.Timeout;

    // Mobile/APK: shorter intro (3s) to avoid feeling like app is hanging
    // Desktop: full intro (5s) for the premium landing experience
    const introDuration = isMobile ? 3000 : 5000;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
      completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
    }, introDuration);

    return () => {
      window.removeEventListener('resize', handleResize);
      hasInitRef.current = false;
      particlesRef.current = [];
      clearTimeout(exitTimer);
      if (completeTimer) {
        clearTimeout(completeTimer);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMobile, onComplete, spawnWord]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden select-none transition-opacity duration-600 ease-out ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Large radial glow centered on screen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(157,78,221,0.18) 0%, rgba(123,44,191,0.06) 50%, transparent 70%)',
        }}
      />

      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />

      {/* Tagline underneath — positioned absolutely near bottom */}
      <p
        className="absolute bottom-16 left-0 right-0 text-center font-inter tracking-[0.3em] uppercase text-xs md:text-sm"
        style={{
          color: 'rgba(216, 180, 254, 0.75)',
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
        }}
      >
        Say it.&nbsp;&nbsp;Without being seen.
      </p>

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.92)' }}
      />
    </div>
  );
}
