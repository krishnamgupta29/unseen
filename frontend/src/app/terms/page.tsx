'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, AlertTriangle, Scale, ScrollText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#080016] text-gray-300 font-inter overflow-x-hidden">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-unseen-600/10 rounded-full blur-[120px]" />
      </div>

      <nav className="w-full p-6 relative z-10 max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center text-unseen-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-unseen-400 mb-12">
          Effective from: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Terms Section List */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <BookOpen className="text-unseen-400" /> 1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed text-gray-400">
                By accessing and using Unseen, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our platform.
              </p>
            </div>

            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <AlertTriangle className="text-unseen-400" /> 2. Community Guidelines
              </h2>
              <p className="leading-relaxed mb-4 text-gray-400">While Unseen champions freedom of speech, we maintain a strict boundary against abuse to keep the community safe. You agree NOT to post:</p>
              <ul className="list-disc pl-5 space-y-2 text-unseen-200">
                <li>Hate speech or discriminatory content.</li>
                <li>Threats of violence, self-harm, or targeted harassment.</li>
                <li>Illegal content, including illicit material or piracy links.</li>
                <li>Doxxing (revealing others' personal real-world information).</li>
                <li>Spam or excessive self-promotion.</li>
              </ul>
            </div>

            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <Scale className="text-unseen-400" /> 3. Account Moderation
              </h2>
              <p className="leading-relaxed text-gray-400">
                Our AI moderation pipeline analyzes public posts to ensure compliance with our guidelines. Unseen reserves the right to suspend or permanently terminate accounts that repeatedly violate these terms. If you are suspended, you may appeal via our contact channels.
              </p>
            </div>

            <div className="glass p-8 md:p-10 rounded-3xl border border-unseen-800/50 bg-[#09031a]/30">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <ScrollText className="text-unseen-400" /> 4. Limitation of Liability
              </h2>
              <p className="leading-relaxed text-gray-400">
                Unseen is provided "as is". We are not liable for the content posted by users, though we actively moderate to maintain a safe environment. We do not guarantee uninterrupted platform availability.
              </p>
            </div>
          </div>

          {/* Consensus Balance/Guidelines Graphic */}
          <div className="hidden lg:flex lg:col-span-5 w-full justify-center sticky top-6">
            <div className="relative w-full max-w-[400px] h-[420px] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-unseen-800 bg-[#09031a]/45 shadow-2xl glass p-6">
              {/* Circular futuristic interface design */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(90,24,154,0.12)_0%,transparent_65%)]" />
              
              {/* Glowing grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(123,44,191,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(123,44,191,0.02)_1px,transparent_1px)] bg-[size:16px_16px]" />

              {/* Dynamic neon vector scale / balance of justice */}
              <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[280px] h-full pt-8">
                {/* Base of scale */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative flex flex-col items-center"
                >
                  {/* Top Beam */}
                  <div className="w-56 h-1 bg-gradient-to-r from-unseen-600 via-unseen-300 to-unseen-600 rounded-full relative">
                    {/* Left hanging pan */}
                    <motion.div 
                      animate={{ rotate: [-2, 2, -2] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -left-1 top-1 flex flex-col items-center origin-top"
                    >
                      <div className="w-0.5 h-12 bg-unseen-400" />
                      <div className="w-12 h-6 border-b-2 border-x-2 border-unseen-400 rounded-b-full bg-unseen-900/60 shadow-[0_4px_10px_rgba(157,78,221,0.2)] flex items-center justify-center text-[8px] text-green-400 font-bold">
                        SAFE
                      </div>
                    </motion.div>
                    
                    {/* Right hanging pan */}
                    <motion.div 
                      animate={{ rotate: [2, -2, 2] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -right-1 top-1 flex flex-col items-center origin-top"
                    >
                      <div className="w-0.5 h-12 bg-unseen-400" />
                      <div className="w-12 h-6 border-b-2 border-x-2 border-unseen-400 rounded-b-full bg-unseen-900/60 shadow-[0_4px_10px_rgba(157,78,221,0.2)] flex items-center justify-center text-[8px] text-red-400 font-bold">
                        HATE
                      </div>
                    </motion.div>
                  </div>

                  {/* Main Pillar */}
                  <div className="w-2.5 h-28 bg-gradient-to-b from-unseen-450 to-unseen-900 rounded-full my-1 shadow-[0_0_15px_rgba(157,78,221,0.4)]" />
                  
                  {/* Foundation */}
                  <div className="w-20 h-3 bg-unseen-800 border border-unseen-600 rounded-full shadow-lg" />
                </motion.div>

                {/* Floating guidelines icons */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -left-8 top-16 bg-[#0f0724] border border-unseen-700 px-3 py-1.5 rounded-full text-xs text-white font-mono flex items-center gap-1.5 shadow-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Respect
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                  className="absolute -right-8 top-24 bg-[#0f0724] border border-unseen-700 px-3 py-1.5 rounded-full text-xs text-white font-mono flex items-center gap-1.5 shadow-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> No Dox
                </motion.div>
              </div>

              <div className="absolute bottom-6 text-center">
                <span className="text-xs uppercase tracking-widest font-mono text-unseen-300 bg-unseen-900/80 px-4 py-1.5 rounded-full border border-unseen-800 shadow-md">
                  Social Consensus Code
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
