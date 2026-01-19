'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: () => void;
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  const handleSocialClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipple({ x, y, id: Date.now() });
    setTimeout(() => {
      setRipple(null);
      onLogin();
    }, 300);
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0f1c 0%, #0c1628 50%, #0a1020 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(74, 124, 201, 0.08) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59, 92, 168, 0.06) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div 
          className="text-center mb-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.h1 
            className="text-5xl font-bold tracking-[0.25em] mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
            initial={{ letterSpacing: '0.5em', opacity: 0 }}
            animate={{ letterSpacing: '0.25em', opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <span className="gradient-text">UNSEEN</span>
          </motion.h1>
          <motion.p 
            className="text-[#5a7ab0] text-sm tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            Say it. Without being seen.
          </motion.p>
        </motion.div>

        <motion.div 
          className="glass rounded-3xl p-8 intimate-shadow"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          layout
        >
          <div className="flex gap-2 p-1.5 bg-[#0d1526]/60 rounded-2xl mb-8">
            <motion.button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative ${
                isLogin 
                  ? 'text-[#e0eaff]' 
                  : 'text-[#5a7ab0] hover:text-[#7a9fd4]'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {isLogin && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#2a4d8f]/40 to-[#3b5ca8]/40 rounded-xl"
                  layoutId="authTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </motion.button>
            <motion.button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative ${
                !isLogin 
                  ? 'text-[#e0eaff]' 
                  : 'text-[#5a7ab0] hover:text-[#7a9fd4]'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              {!isLogin && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-[#2a4d8f]/40 to-[#3b5ca8]/40 rounded-xl"
                  layoutId="authTab"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Create Account</span>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={false}
              animate={{ 
                height: isLogin ? 0 : 'auto', 
                opacity: isLogin ? 0 : 1,
                marginBottom: isLogin ? 0 : 16,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7ab0]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-xl py-4 pl-12 pr-4 text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none focus:border-[#4a7cc9]/50 focus:bg-[#1a2d50]/50 transition-all"
                />
              </div>
            </motion.div>

            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7ab0] group-focus-within:text-[#7aa2e3] transition-colors" />
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-xl py-4 pl-12 pr-4 text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none focus:border-[#4a7cc9]/50 focus:bg-[#1a2d50]/50 transition-all"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7ab0] group-focus-within:text-[#7aa2e3] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-xl py-4 pl-12 pr-12 text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none focus:border-[#4a7cc9]/50 focus:bg-[#1a2d50]/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a7ab0] hover:text-[#7a9fd4] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {isLogin && (
              <motion.div 
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <button type="button" className="text-sm text-[#7aa2e3] hover:text-[#9ab8ed] transition-colors">
                  Forgot password?
                </button>
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full py-4 rounded-xl font-medium text-white relative overflow-hidden group mt-6"
              style={{
                background: 'linear-gradient(135deg, #3b5ca8 0%, #2a4d8f 50%, #1e3b6f 100%)',
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(74, 124, 201, 0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-[15px]">
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-[#4a7cc9] to-[#3b5ca8]"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e3a6e]/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0f1e3d] px-4 text-xs text-[#5a7ab0] tracking-wide">or continue with</span>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={handleSocialClick}
              className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#142240]/50 border border-[#1e3a6e]/20 hover:bg-[#1a2d50]/60 hover:border-[#2a4d8f]/30 transition-all relative overflow-hidden group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {ripple && (
                <motion.span
                  className="absolute bg-[#4a7cc9]/20 rounded-full"
                  style={{
                    left: ripple.x - 50,
                    top: ripple.y - 50,
                    width: 100,
                    height: 100,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
              <GoogleLogo className="w-5 h-5" />
              <span className="text-sm text-[#a0c4ff] font-medium hidden sm:inline">Google</span>
            </motion.button>

            <motion.button
              onClick={handleSocialClick}
              className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#142240]/50 border border-[#1e3a6e]/20 hover:bg-[#1a2d50]/60 hover:border-[#2a4d8f]/30 transition-all relative overflow-hidden group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <AppleLogo className="w-5 h-5 text-[#a0c4ff]" />
              <span className="text-sm text-[#a0c4ff] font-medium hidden sm:inline">Apple</span>
            </motion.button>

            <motion.button
              onClick={handleSocialClick}
              className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[#142240]/50 border border-[#1e3a6e]/20 hover:bg-[#1a2d50]/60 hover:border-[#2a4d8f]/30 transition-all relative overflow-hidden group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <XLogo className="w-4 h-4 text-[#a0c4ff]" />
              <span className="text-sm text-[#a0c4ff] font-medium hidden sm:inline">X</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.p 
          className="text-center text-[#3b5998] text-xs mt-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          By continuing, you agree to our{' '}
          <span className="text-[#5a7ab0] hover:text-[#7a9fd4] cursor-pointer transition-colors">Terms of Service</span>
          {' '}and{' '}
          <span className="text-[#5a7ab0] hover:text-[#7a9fd4] cursor-pointer transition-colors">Privacy Policy</span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
