'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { auth, setAccessToken } from '@/lib/api';
import { useAppContext } from '@/context/AppContext';


export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await auth.login(username, password);
      setAccessToken(data.accessToken);
      login(data.user);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080016] overflow-hidden relative">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-24 relative z-10 border-r border-unseen-800/30">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[30%] left-[-20%] w-[60%] h-[60%] bg-unseen-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-unseen-400/10 rounded-full blur-[100px]" />
        </div>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <Link href="/">
            <h1 className="text-5xl xl:text-7xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-500 tracking-wide mb-6">
              UNSEEN
            </h1>
          </Link>
          <h2 className="text-3xl font-semibold text-white mb-6 font-poppins">
            Welcome back to the <br />
            <span className="text-unseen-300">shadows.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md font-inter leading-relaxed">
            Your identity remains a secret. Dive back into the anonymous world of raw thoughts and deep connections.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-unseen-700/30 shadow-[0_0_40px_rgba(36,0,70,0.5)] my-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block lg:hidden mb-4">
              <h1 className="text-3xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400 tracking-wide">
                UNSEEN
              </h1>
            </Link>
            <h3 className="text-2xl font-bold text-white mb-2">Access Identity</h3>
            <p className="text-gray-400 text-sm font-inter">Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative overflow-hidden p-4 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-red-950/40 text-red-200 text-sm font-medium shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-start gap-2.5"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 via-purple-500 to-red-500" />
                <span className="flex-shrink-0 text-red-400 w-5 h-5 flex items-center justify-center font-bold border border-red-500/40 rounded-full text-xs bg-red-950/80 mt-0.5 font-mono">
                  !
                </span>
                <div className="flex-1 leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-red-400 block mb-0.5">Identity Alert</span>
                  <p className="font-inter text-xs">{error}</p>
                </div>
              </motion.div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-inter">Username, Email, or Full Name</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-unseen-900/50 border border-unseen-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400 transition-all font-mono"
                placeholder="Enter your identity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 font-inter">Password</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-unseen-900/50 border border-unseen-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400 focus:ring-1 focus:ring-unseen-400 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-unseen-300 transition-colors focus:outline-none">
                  <motion.div initial={false} animate={{ scale: showPassword ? 1.1 : 1, rotate: showPassword ? 15 : 0 }} className={showPassword ? 'text-unseen-400 drop-shadow-[0_0_5px_rgba(157,78,221,0.8)]' : ''}>
                    {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </motion.div>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-gradient-to-r from-unseen-600 to-unseen-800 text-white font-semibold hover:shadow-[0_0_20px_rgba(123,44,191,0.6)] transition-all transform hover:scale-[1.02] mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Authenticating...' : 'Enter the Void'}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an identity yet?{' '}
              <Link href="/signup" className="text-unseen-300 hover:text-unseen-200 transition-colors font-medium">
                Claim one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
