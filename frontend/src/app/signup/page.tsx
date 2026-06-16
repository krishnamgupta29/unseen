'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { setAccessToken, auth } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';
import EmojiPicker from '@/components/EmojiPicker';
const adjectives = ['Silent', 'Mystic', 'Hidden', 'Dark', 'Neon', 'Lunar', 'Cosmic', 'Shadow'];
const nouns = ['Wolf', 'Raven', 'Ghost', 'Specter', 'Phantom', 'Echo', 'Nomad', 'Soul'];

const generateUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99);
  return `${adj}${noun}${num}`;
};

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    setUsername(generateUsername());
    // Disable heavy blurred orb animations on mobile/tablet to ensure butter-smooth performance
    setShouldAnimate(window.innerWidth >= 768);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await auth.signup(displayName, password, undefined, username);

      setAccessToken(data.accessToken, data.refreshToken);
      login(data.user);
      
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080016] overflow-hidden relative select-none">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={shouldAnimate ? { 
            x: [0, 80, -40, 0], 
            y: [0, -60, 40, 0],
            scale: [1, 1.2, 0.9, 1]
          } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-unseen-600/15 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={shouldAnimate ? { 
            x: [0, -60, 50, 0], 
            y: [0, 80, -50, 0],
            scale: [1, 0.9, 1.1, 1]
          } : {}}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] bg-unseen-500/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={shouldAnimate ? { 
            x: [0, 30, -50, 0], 
            y: [0, 40, -30, 0],
            scale: [1, 1.15, 0.85, 1]
          } : {}}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-unseen-700/10 rounded-full blur-[90px]" 
        />
      </div>

      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-24 relative z-10 border-r border-unseen-800/30 bg-[#080016]/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/">
            <h1 className="text-5xl xl:text-7xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-500 tracking-wide mb-6 filter drop-shadow-[0_0_20px_rgba(157,78,221,0.3)]">
              UNSEEN
            </h1>
          </Link>
          <h2 className="text-3xl font-semibold text-white mb-6 font-poppins">
            Shed your real identity. <br/>
            <span className="text-unseen-300">Embrace the unknown.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md font-inter leading-relaxed">
            Create an untraceable persona. Express your deepest emotions, confess your secrets, and connect with strangers in total anonymity.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-y-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-unseen-700/40 shadow-[0_0_50px_rgba(36,0,70,0.6)] my-auto relative overflow-hidden group"
        >
          {/* Ambient card top border glow */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-unseen-400 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

          <div className="text-center mb-8">
            <Link href="/" className="inline-block lg:hidden mb-4">
              <h1 className="text-4xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400 tracking-wide filter drop-shadow-[0_0_15px_rgba(157,78,221,0.4)]">
                UNSEEN
              </h1>
            </Link>
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Create Account</h3>
            <p className="text-gray-400 text-sm font-inter">Join the community securely.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative overflow-hidden p-4 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-red-950/40 text-red-200 text-sm font-medium shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-start gap-2.5"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-purple-500 to-red-500" />
                <span className="flex-shrink-0 text-red-400 w-5 h-5 flex items-center justify-center font-bold border border-red-500/40 rounded-full text-xs bg-red-950/80 mt-0.5 font-mono">
                  !
                </span>
                <div className="flex-1 leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-red-400 block mb-0.5">Error</span>
                  <p className="font-inter text-xs">{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-unseen-300 uppercase tracking-widest mb-2 font-inter">Username</label>
              <div className="flex items-center bg-unseen-950/60 border border-unseen-800/80 rounded-2xl px-4 py-3 cursor-default transition-all duration-300 select-none shadow-inner">
                <input
                  type="text"
                  required
                  readOnly
                  value={username}
                  className="bg-transparent text-unseen-400 font-semibold flex-1 font-mono tracking-wider focus:outline-none cursor-default text-sm"
                  placeholder="e.g. ShadowWolf21"
                />
                <button
                  type="button"
                  onClick={() => setUsername(generateUsername())}
                  className="text-gray-400 hover:text-unseen-300 transition-colors ml-3 cursor-pointer shrink-0"
                  title="Generate random username"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-hover" />
                </button>
              </div>
              <p className="text-[10px] text-unseen-400 mt-2 whitespace-normal break-words leading-relaxed">Generated automatically. Tap refresh to generate a new username. Keep this anonymous.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-unseen-300 uppercase tracking-widest mb-2 font-inter">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-unseen-950/40 border border-unseen-800/60 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400/50 shadow-inner transition-all duration-300 text-sm"
                placeholder="How others see you (e.g. Dreamer)"
              />
              <p className="text-[10px] text-amber-500/90 mt-2 whitespace-normal break-words leading-relaxed font-medium flex items-center gap-1">
                <span>⚠️ Do not use your real name to maintain total anonymity.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-unseen-300 uppercase tracking-widest mb-2 font-inter">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-unseen-950/40 border border-unseen-800/60 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400/50 shadow-inner transition-all duration-300 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unseen-300 transition-colors focus:outline-none"
                >
                  <motion.div
                    initial={false}
                    animate={{ scale: showPassword ? 1.1 : 1, rotate: showPassword ? 15 : 0 }}
                    className={showPassword ? 'text-unseen-400 drop-shadow-[0_0_5px_rgba(157,78,221,0.8)]' : ''}
                  >
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </motion.div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-unseen-600 via-unseen-700 to-unseen-800 text-white font-semibold shadow-[0_0_20px_rgba(123,44,191,0.3)] hover:shadow-[0_0_30px_rgba(123,44,191,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm font-inter">
              Already have an account?{' '}
              <Link href="/login" className="text-unseen-300 hover:text-unseen-200 transition-colors font-medium">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
