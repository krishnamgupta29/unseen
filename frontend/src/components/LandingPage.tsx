'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Shield, Users, Mic, Lock, Zap, Download } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="min-h-screen relative w-full overflow-hidden select-none"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-unseen-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-unseen-800/40 rounded-full blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-6 md:px-12 relative z-10">
        <div className="text-2xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400">
          UNSEEN
        </div>
        <div className="space-x-4">
          <Link href="/login" className="text-sm font-medium text-unseen-200 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-unseen-600 hover:bg-unseen-500 text-white px-5 py-2.5 rounded-full shadow-[0_0_15px_rgba(90,24,154,0.5)] transition-all">
            Join Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center space-x-2 glass px-4 py-1.5 rounded-full text-unseen-300 text-xs md:text-sm mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-unseen-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-unseen-400"></span>
          </span>
          <span>The next generation of social media</span>
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl md:text-7xl font-poppins font-bold leading-tight max-w-4xl"
        >
          Say what you can't say <span className="text-transparent bg-clip-text bg-gradient-to-r from-unseen-300 to-unseen-500">anywhere else.</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl font-inter"
        >
          A mysterious, anonymous-first social media platform. Share thoughts, confessions, and experiences without revealing your real identity.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid grid-cols-2 gap-4 mt-10 w-full max-w-lg px-4"
        >
          <Link href="/signup" className="px-4 py-3.5 rounded-full bg-gradient-to-r from-unseen-600 to-unseen-800 text-white font-semibold text-sm md:text-lg hover:shadow-[0_0_30px_rgba(123,44,191,0.6)] transition-all transform hover:scale-105 text-center flex items-center justify-center">
            Join Unseen
          </Link>
          <a href="/unseen.apk" download className="px-4 py-3.5 rounded-full glass glass-glow text-white font-semibold text-sm md:text-lg transition-all flex items-center justify-center gap-2 text-center">
            <Download className="w-4 h-4 md:w-5 md:h-5" /> Download APK
          </a>
        </motion.div>
      </section>

      {/* Showcase Section */}
      <section className="py-20 px-6 md:px-12 relative z-10 flex flex-col items-center max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-poppins font-bold mb-16 text-center">Experience the Unseen</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {/* Feature 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12 glass-glow relative overflow-hidden group col-span-1"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-unseen-600/10 rounded-full blur-3xl -z-10 group-hover:bg-unseen-500/20 transition-colors" />
            <Shield className="w-12 h-12 text-unseen-300 mb-6" />
            <h3 className="text-2xl font-bold font-poppins mb-4 text-white">Absolute Privacy</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              No real names, no phone numbers, no tracking. Your identity is cryptographically protected and never exposed to the public. Express yourself without the anxiety of social consequences.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-8 md:p-12 glass-glow relative overflow-hidden group col-span-1"
          >
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-unseen-800/20 rounded-full blur-3xl -z-10 group-hover:bg-unseen-700/30 transition-colors" />
            <Lock className="w-12 h-12 text-unseen-400 mb-6" />
            <h3 className="text-2xl font-bold font-poppins mb-4 text-white">End-to-End Encrypted Chat</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Connect deeply with other anonymous minds through AES-256 encrypted private messaging. Only you and the recipient can read the messages. Not even our servers can see what you type.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 md:p-12 glass-glow relative overflow-hidden group col-span-1 sm:col-span-2 lg:col-span-3"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-unseen-900/30 rounded-full blur-[100px] -z-10" />
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <Zap className="w-12 h-12 text-unseen-300 mb-6" />
                <h3 className="text-2xl md:text-3xl font-bold font-poppins mb-4 text-white">Intelligent Mood Feed</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                  Our smart feed adapts to your emotional state. Select a mood tag, and the algorithm surfaces content that resonates with exactly how you feel right now. From late-night thoughts to exciting confessions.
                </p>
                <Link href="/signup" className="text-unseen-300 font-semibold hover:text-unseen-200 transition-colors flex items-center gap-2">
                  Try it now <span className="text-xl">→</span>
                </Link>
              </div>
              <div className="flex-1 w-full bg-[#0a0514] border border-unseen-800 rounded-2xl p-6 shadow-2xl">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-unseen-800">
                      <div className="flex gap-2">
                         <span className="px-3 py-1 rounded-full bg-unseen-900/50 text-unseen-300 text-xs font-mono">#LateNight</span>
                         <span className="px-3 py-1 rounded-full bg-unseen-900/50 text-unseen-400 text-xs font-mono">#Confession</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="space-y-2 opacity-50">
                      <div className="h-4 bg-unseen-800 rounded w-3/4" />
                      <div className="h-4 bg-unseen-800 rounded w-full" />
                      <div className="h-4 bg-unseen-800 rounded w-5/6" />
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-unseen-800/50 text-center text-gray-500 text-sm">
        <div className="flex justify-center space-x-6 mb-6">
          <Link href="/about" className="hover:text-unseen-300 transition">About</Link>
          <Link href="/privacy" className="hover:text-unseen-300 transition">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-unseen-300 transition">Terms</Link>
          <Link href="/contact" className="hover:text-unseen-300 transition">Contact</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} Unseen. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}
