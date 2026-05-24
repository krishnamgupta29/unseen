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

  useEffect(() => {
    setUsername(generateUsername());
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await auth.signup(displayName, password, undefined, username);

      setAccessToken(data.accessToken);
      login(data.user);
      
      router.push('/feed');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080016] overflow-hidden">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-24 relative z-10 border-r border-unseen-800/30">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[30%] left-[-20%] w-[60%] h-[60%] bg-unseen-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-unseen-400/10 rounded-full blur-[100px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/">
            <h1 className="text-5xl xl:text-7xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-500 tracking-wide mb-6">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Mobile Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full lg:hidden overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-unseen-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[10%] w-[30%] h-[30%] bg-unseen-400/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-unseen-700/30 shadow-[0_0_40px_rgba(36,0,70,0.5)] my-auto"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-block lg:hidden mb-4">
              <h1 className="text-3xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400 tracking-wide">
                UNSEEN
              </h1>
            </Link>
            <h3 className="text-2xl font-bold text-white mb-2">Claim Identity</h3>
            <p className="text-gray-400 text-sm font-inter">Join the community securely.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}
            
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 font-inter">Your Permanent Identity (Username)</label>
              <div className="flex items-center bg-unseen-950/80 border border-unseen-800/80 rounded-xl px-4 py-3 cursor-not-allowed transition-all select-none">
                <input
                  type="text"
                  required
                  readOnly
                  value={username}
                  className="bg-transparent text-unseen-400/80 font-semibold flex-1 font-mono tracking-wider focus:outline-none cursor-not-allowed"
                  placeholder="e.g. ShadowWolf21"
                />
                <button
                  type="button"
                  onClick={() => setUsername(generateUsername())}
                  className="text-gray-500 hover:text-unseen-300 transition-colors ml-3 cursor-pointer"
                  title="Generate random identity"
                >
                  <RefreshCw className="w-5 h-5 animate-spin-hover" />
                </button>
              </div>
              <p className="text-xs text-unseen-600 mt-2">Generated automatically. Tap refresh to roll a new identity.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-inter">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-unseen-900/50 border border-unseen-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400 transition-all"
                placeholder="How others see you (e.g. Dreamer)"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-inter">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-unseen-900/50 border border-unseen-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unseen-300 transition-colors focus:outline-none"
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-unseen-600 to-unseen-800 text-white font-semibold hover:shadow-[0_0_20px_rgba(123,44,191,0.6)] transition-all transform hover:scale-[1.02] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Identity'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Already have an identity?{' '}
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
