'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';

interface AuthScreenProps {
  onLogin: () => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const { login } = useApp();

  const generateUsername = () => {
    const prefixes = ['unseen', 'agent', 'soul', 'shadow', 'silent', 'echo'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const newUsername = `${randomPrefix}${randomNumber}`;
    setFormData(prev => ({ ...prev, username: newUsername }));
  };

  useEffect(() => {
    if (!isLogin && !formData.username) {
      generateUsername();
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Use AppContext login
        const loggedUser = data.user;
        if (loggedUser) {
          login({ ...loggedUser, id: loggedUser._id || loggedUser.id });
          onLogin();
        } else {
          setErrorMsg('User data not found in response');
        }
      } else {
        setErrorMsg(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to server');
    }
  };


  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #050505 0%, #0a0a0f 50%, #050505 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <motion.div 
          className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(106, 0, 255, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, -50, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.6, 0.3],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <div className="w-full max-w-6xl relative z-10 flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        {/* LEFT: Features */}
        <motion.div 
          className="flex-1 hidden md:block"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.h1 
            className="text-6xl font-bold tracking-[0.2em] mb-6"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-300 to-[#6a00ff]">UNSEEN</span>
          </motion.h1>
          <p className="text-gray-400 text-lg mb-12 max-w-md leading-relaxed">
            A premium sanctuary for your thoughts. No algorithms. No identity tracking. Just pure expression.
          </p>

          <div className="grid grid-cols-2 gap-6 w-full mt-8">
            {[
              { title: "Fully Anonymous Messaging", desc: "Speak your truth without identity weight.", icon: "💬" },
              { title: "No Identity Tracking", desc: "We don't know who you are.", icon: "👁️‍🗨️" },
              { title: "Secure Sharing", desc: "End-to-end encrypted drops.", icon: "🔐" },
              { title: "Zero Exposure", desc: "Your data stays yours completely.", icon: "🛡️" }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(106,0,255,0.15)] transition-all duration-300 group cursor-default"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: "spring", bounce: 0.4 }}
              >
                <div className="text-3xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(106,0,255,0.5)]">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1 drop-shadow-md text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: Auth Panel */}
        <motion.div 
          className="w-full max-w-md lg:max-w-lg flex-1"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Mobile Header (Only visible on small screens) */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-4xl font-bold tracking-[0.2em] mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-[#6a00ff]">UNSEEN</h1>
            <p className="text-gray-400 text-sm">Say it. Without being seen.</p>
          </div>

          <motion.div 
            className="glass-strong rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(106,0,255,0.15)] relative overflow-hidden"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          layout
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6a00ff] to-transparent opacity-50" />
          
          <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl mb-8 border border-white/5 relative z-10">
            <motion.button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative ${
                isLogin 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {isLogin && (
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(106,0,255,0.3)]"
                  layoutId="authTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Login</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative ${
                !isLogin 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {!isLogin && (
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(106,0,255,0.3)]"
                  layoutId="authTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Sign Up</span>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00f0ff] transition-colors" />
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                readOnly={!isLogin}
                onChange={(e) => isLogin && setFormData({ ...formData, username: e.target.value })}
                className={`w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 ${!isLogin ? 'pr-12' : 'pr-4'} text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all ${!isLogin ? 'opacity-80' : ''}`}
              />
              {!isLogin && (
                <button
                  type="button"
                  onClick={generateUsername}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-all hover:rotate-180 duration-500 bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
                  title="Generate Random Username"
                >
                  🎲
                </button>
              )}
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 pl-1 -mt-3">A random alias guarantees absolute anonymity.</p>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00f0ff] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <motion.div
              initial={false}
              animate={{ 
                height: isLogin ? 0 : 'auto', 
                opacity: isLogin ? 0 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative group pt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00f0ff] transition-colors" />
                <input
                  type="email"
                  placeholder="Recovery Email (Optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>
            </motion.div>

            {errorMsg && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm font-medium text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
              >
                {errorMsg}
              </motion.p>
            )}

            {isLogin && (
              <motion.div 
                className="flex justify-end pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button type="button" className="text-sm text-gray-400 hover:text-[#00f0ff] hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all">
                  Forgot password?
                </button>
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full py-4 rounded-xl font-medium text-white relative overflow-hidden group mt-8 bg-gradient-to-r from-[#6a00ff] to-[#ff00ea]"
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(106, 0, 255, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-[15px]">
                {isLogin ? 'Secure Login' : 'Enter the Unseen'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
            
            <p className="text-center text-gray-500 text-sm mt-4">
              {isLogin ? "Don't have an account? " : "Already have an identity? "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-white hover:text-[#00f0ff] hover:underline transition-all"
              >
                {isLogin ? "Create one" : "Login"}
              </button>
            </p>
          </form>
        </motion.div>
      </motion.div>
      </div>

      {/* FOOTER */}
      <motion.footer 
        className="absolute bottom-0 inset-x-0 pb-6 pt-4 bg-black/40 backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent mb-4 shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 text-xs font-medium tracking-widest uppercase text-gray-500">
            <a href="#" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Privacy</a>
            <a href="#" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Terms</a>
            <a href="#" className="hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">Support</a>
            <a href="mailto:useen3113@gmail.com" className="text-[#00f0ff] hover:text-white hover:drop-shadow-[0_0_8px_#00f0ff] transition-all">useen3113@gmail.com</a>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4 tracking-widest uppercase">© 2026 UNSEEN. Zero Identity Tracked.</p>
        </div>
      </motion.footer>

    </motion.div>
  );
}
