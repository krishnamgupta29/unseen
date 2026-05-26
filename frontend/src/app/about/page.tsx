'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Shield, Zap, Sparkles, EyeOff, Key, Compass } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#080016] text-gray-300 font-inter overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-unseen-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-unseen-800/20 rounded-full blur-[150px]" />
      </div>

      <nav className="w-full p-6 relative z-10 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center text-unseen-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="text-xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400">
          UNSEEN
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl md:text-6xl font-poppins font-bold text-white mb-6 leading-tight">
              About Unseen
            </h1>
            
            <div className="glass rounded-3xl p-8 md:p-10 shadow-[0_0_40px_rgba(36,0,70,0.3)] border border-unseen-850 bg-[#09031a]/30">
              <Sparkles className="w-12 h-12 text-unseen-400 mb-6 drop-shadow-[0_0_15px_rgba(157,78,221,0.8)]" />
              <p className="text-lg md:text-xl leading-relaxed mb-6 text-gray-200">
                In a world obsessed with carefully curated digital identities, the truth often gets lost. We created <span className="text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-500 font-bold">Unseen</span> to give people a place where they can speak freely, without the anxiety of social consequences or the pressure of maintaining a personal brand.
              </p>
              <p className="text-lg leading-relaxed text-gray-300">
                Unseen is a platform designed for raw, unfiltered expression. It's a sanctuary for midnight thoughts, honest confessions, and deep conversations with strangers who share your vibe.
              </p>
            </div>
          </div>

          {/* Visual Oracle/Portal */}
          <div className="hidden lg:flex lg:col-span-5 w-full justify-center">
            <div className="relative w-full max-w-[400px] h-[380px] md:h-[420px] flex items-center justify-center overflow-hidden rounded-3xl border border-unseen-850 bg-[#09031a]/40 shadow-2xl glass p-6">
              {/* Cosmic background particles */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,44,191,0.15)_0%,transparent_70%)]" />
              
              {/* Orbiting Ring 1 */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-72 h-72 rounded-full border border-dashed border-unseen-500/20"
              />
              
              {/* Orbiting Ring 2 */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                className="absolute w-60 h-60 rounded-full border border-dotted border-unseen-400/30"
              />

              {/* Orbiting Ring 3 */}
              <motion.div
                animate={{ rotate: 180 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute w-48 h-48 rounded-full border border-unseen-300/10 flex items-center justify-center"
              />

              {/* Core Glowing Orb */}
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 40px rgba(123,44,191,0.3)",
                    "0 0 60px rgba(157,78,221,0.5)",
                    "0 0 40px rgba(123,44,191,0.3)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-unseen-700/60 to-unseen-900/60 border border-unseen-450 flex items-center justify-center backdrop-blur-md"
              >
                <EyeOff className="w-16 h-16 text-unseen-300 drop-shadow-[0_0_10px_rgba(157,78,221,0.8)]" />
                
                {/* Internal rotating core element */}
                <div className="absolute inset-2 rounded-full border border-t-unseen-400 border-r-transparent border-b-unseen-500 border-l-transparent animate-spin" />
              </motion.div>

              {/* Floating Symbols around the core */}
              <motion.div
                animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 bg-unseen-900/80 border border-unseen-800 p-2.5 rounded-xl shadow-lg flex items-center justify-center"
              >
                <Shield className="w-5 h-5 text-unseen-400" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-1/4 right-1/4 bg-unseen-900/80 border border-unseen-800 p-2.5 rounded-xl shadow-lg flex items-center justify-center"
              >
                <Key className="w-5 h-5 text-unseen-400" />
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0], x: [0, 10, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/3 right-1/4 bg-unseen-900/80 border border-unseen-800 p-2.5 rounded-xl shadow-lg flex items-center justify-center"
              >
                <Compass className="w-5 h-5 text-unseen-400" />
              </motion.div>
              
              <div className="absolute bottom-6 text-center">
                <span className="text-xs uppercase tracking-widest font-mono text-unseen-400 bg-unseen-950/80 px-4 py-1.5 rounded-full border border-unseen-850 shadow-md">
                  Decentralized Mind
                </span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-poppins font-bold text-white mb-8 text-center">
          Our Core Values
        </h2>
        
        <div className="adaptive-card-grid">
          <div className="glass p-8 rounded-2xl transition-all hover:bg-unseen-900/50 border border-unseen-800/30 col-span-1">
            <Shield className="w-10 h-10 text-unseen-400 mb-4 drop-shadow-[0_0_10px_rgba(157,78,221,0.8)]" />
            <h3 className="text-xl font-bold text-white mb-3">Absolute Privacy</h3>
            <p className="text-sm leading-relaxed text-gray-400">Your identity is yours alone. We don't ask for phone numbers, and we cryptographically protect your data to ensure you remain untraceable.</p>
          </div>
          <div className="glass p-8 rounded-2xl transition-all hover:bg-unseen-900/50 border border-unseen-800/30 col-span-1">
            <Users className="w-10 h-10 text-unseen-400 mb-4 drop-shadow-[0_0_10px_rgba(157,78,221,0.8)]" />
            <h3 className="text-xl font-bold text-white mb-3">Safe Spaces</h3>
            <p className="text-sm leading-relaxed text-gray-400">Freedom of speech doesn't mean freedom from consequences. Our AI moderation ensures the platform remains free from hate, bullying, and illegal content.</p>
          </div>
          <div className="glass p-8 rounded-2xl transition-all hover:bg-unseen-900/50 border border-unseen-800/30 col-span-1 sm:col-span-2 lg:col-span-1">
            <Zap className="w-10 h-10 text-unseen-400 mb-4 drop-shadow-[0_0_10px_rgba(157,78,221,0.8)]" />
            <h3 className="text-xl font-bold text-white mb-3">Authentic Connection</h3>
            <p className="text-sm leading-relaxed text-gray-400">By removing the superficial layers of profiles and pictures, we help you connect with others on a purely emotional and intellectual level.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
