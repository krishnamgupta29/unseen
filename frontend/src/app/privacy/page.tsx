'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#080016] text-gray-300 font-inter overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-unseen-600/10 rounded-full blur-[120px]" />
      </div>

      <nav className="w-full p-6 relative z-10 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center text-unseen-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-unseen-400 mb-12">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Privacy Rules */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <EyeOff className="text-unseen-400" /> 1. The Philosophy of the Unseen
              </h2>
              <p className="leading-relaxed text-gray-300">
                At Unseen, privacy is not just a feature; it is the entire foundation of our platform. We believe that true expression requires anonymity. Therefore, we collect as little data as possible, and what we do collect is protected with industry-standard encryption.
              </p>
            </div>

            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Lock className="text-unseen-400" /> 2. What We Collect
              </h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li><strong>Email Address:</strong> Optional. Used solely for password recovery. It is not displayed publicly.</li>
                <li><strong>Passwords:</strong> Hashed using bcrypt (12 rounds) and never stored in plain text.</li>
                <li><strong>Content:</strong> Your posts and interactions.</li>
                <li><strong>Private Messages:</strong> Encrypted using AES-256 before being saved to our database.</li>
              </ul>
            </div>

            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <ShieldCheck className="text-unseen-400" /> 3. What We DON'T Collect
              </h2>
              <ul className="list-disc pl-5 space-y-3 text-gray-300">
                <li>We do not collect your real name.</li>
                <li>We do not collect your phone number.</li>
                <li>We do not track your location via GPS.</li>
                <li>We do not sell your data to advertisers. Ever.</li>
              </ul>
            </div>
          </div>

          {/* Privacy Sentinel Visual Widget */}
          <div className="hidden lg:flex lg:col-span-5 w-full justify-center sticky top-6">
            <div className="relative w-full max-w-[400px] h-[450px] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-unseen-800 bg-[#09031a]/45 shadow-2xl glass p-6">
              {/* Matrix-like digital grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(123,44,191,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(123,44,191,0.05)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
              
              {/* Security scanning line */}
              <motion.div
                animate={{ y: [-150, 150, -150] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-unseen-400/50 to-transparent blur-[2px]"
              />

              {/* Cryptographic Node/Lock */}
              <div className="relative z-10 flex items-center justify-center mb-8">
                {/* Outer glowing ring */}
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute w-44 h-44 rounded-full border border-dashed border-unseen-500/30"
                />
                
                {/* Outer hex container */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-36 h-36 rounded-[2rem] bg-unseen-600/5 border border-unseen-500/20 rotate-45 blur-[4px]"
                />

                {/* Dynamic shield node */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative w-28 h-28 rounded-full bg-gradient-to-b from-unseen-800/80 to-unseen-950/80 border-2 border-unseen-450 flex items-center justify-center shadow-[0_0_30px_rgba(157,78,221,0.4)] cursor-pointer"
                >
                  <Shield className="w-12 h-12 text-unseen-300 drop-shadow-[0_0_8px_rgba(157,78,221,0.6)]" />
                </motion.div>
              </div>

              {/* Cryptographic Stream Logs */}
              <div className="w-full relative z-10 space-y-2 bg-[#060212]/80 border border-unseen-900 rounded-xl p-4 font-mono text-[10px] text-unseen-300/80">
                <div className="flex items-center justify-between border-b border-unseen-950 pb-2 mb-2">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px]">Zero-Knowledge Shield</span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[12:44:01]</span>
                  <span className="text-green-400/90">IP_ADDR_RAW</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-unseen-300 truncate">sha256(8c69d...8c3d)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[12:44:02]</span>
                  <span className="text-green-400/90">MESSAGE</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-unseen-300 truncate">aes256_encrypt("Hello...")</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[12:44:02]</span>
                  <span className="text-unseen-400 font-bold">STATUS:</span>
                  <span className="text-green-400">Radically Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
