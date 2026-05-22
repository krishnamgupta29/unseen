/**
 * Audio Synthesizer using Web Audio API
 * No external file assets needed. Completely responsive and works on any browser.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  // Resume context if suspended (browser security autoplays)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Ascending pleasant sci-fi synth chirp for notifications
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Frequency sweep from 600Hz to 1200Hz in 0.15s
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    // Fade out volume quickly to avoid clicking sound
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {
    // Fail silently in case of policy restrictions
  }
}

/**
 * Quick dual note cyber-chime for incoming messages
 */
export function playMessageSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First note (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0.05, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Second note (B5) slightly delayed (60ms)
    setTimeout(() => {
      try {
        const ctx2 = getAudioContext();
        if (!ctx2) return;
        const now2 = ctx2.currentTime;
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(987.77, now2); // B5
        gain2.gain.setValueAtTime(0.05, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.12);
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.12);
      } catch {}
    }, 60);
  } catch (e) {
    // Fail silently
  }
}

// Global user interaction listener to bypass browser autoplay restrictions
if (typeof window !== 'undefined') {
  const initAudioOnInteraction = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        if (ctx.state === 'running') {
          window.removeEventListener('click', initAudioOnInteraction);
          window.removeEventListener('keydown', initAudioOnInteraction);
          window.removeEventListener('touchstart', initAudioOnInteraction);
        }
      }
    } catch (e) {}
  };
  window.addEventListener('click', initAudioOnInteraction);
  window.addEventListener('keydown', initAudioOnInteraction);
  window.addEventListener('touchstart', initAudioOnInteraction);
}

