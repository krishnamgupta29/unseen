'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MessageCircle, Send } from 'lucide-react';

export default function ContactPage() {

  return (
    <main className="min-h-screen bg-[#080016] text-gray-300 font-inter overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-unseen-600/10 rounded-full blur-[120px]" />
      </div>

      <nav className="w-full p-6 relative z-10 max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center text-unseen-400 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-poppins font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl leading-relaxed mb-8 text-unseen-200">
            Have a question, feedback, or need to report an issue? We're here to help maintain the Unseen ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-8">
            {/* Contact Beacon Graphic */}
            <div className="hidden md:flex relative w-full h-full min-h-[280px] items-center justify-center overflow-hidden rounded-3xl border border-unseen-800 bg-[#09031a]/45 shadow-2xl glass p-4">
              {/* Circular signal pulses radiating outward */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(157,78,221,0.1)_0%,transparent_70%)]" />
              
              {/* Ring Waves */}
              <motion.div 
                animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-20 h-20 rounded-full border border-unseen-450/40"
              />
              <motion.div 
                animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1 }}
                className="absolute w-20 h-20 rounded-full border border-unseen-450/30"
              />
              <motion.div 
                animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 2 }}
                className="absolute w-20 h-20 rounded-full border border-unseen-450/20"
              />

              {/* Transmitting Dish/Beacon */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex flex-col items-center"
              >
                {/* Orbiting particles */}
                <div className="absolute w-24 h-24 rounded-full border border-dotted border-unseen-500/20 animate-spin" />
                
                {/* Center Antenna */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-unseen-600/80 to-unseen-900/80 border border-unseen-450 flex items-center justify-center shadow-[0_0_20px_rgba(157,78,221,0.5)]">
                  <Send className="w-7 h-7 text-white transform -rotate-45" />
                </div>
              </motion.div>

              <div className="absolute bottom-4 text-center">
                <span className="text-[10px] uppercase tracking-widest font-mono text-unseen-400 bg-unseen-950/80 px-3 py-1 rounded-full border border-unseen-900 shadow-sm">
                  Broadcast Signal: ACTIVE
                </span>
              </div>
            </div>

            {/* General Inquiries */}
            <a 
              href="mailto:useen3113@gmail.com?subject=General Inquiry" 
              className="glass p-6 rounded-3xl border border-unseen-800/50 hover:border-unseen-500/55 hover:bg-unseen-950/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(157,78,221,0.15)] flex flex-col justify-center items-center text-center gap-4 block group cursor-pointer"
            >
              <div className="bg-unseen-800 p-4 rounded-full shadow-[0_0_15px_rgba(157,78,221,0.3)] group-hover:bg-unseen-700 transition-colors">
                <Mail className="w-8 h-8 text-unseen-300 group-hover:text-white transition-colors animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl group-hover:text-unseen-300 transition-colors">General Inquiries</h3>
                <p className="text-sm text-gray-400 mt-1 font-mono">useen3113@gmail.com</p>
                <p className="text-xs text-gray-500 mt-3 font-inter leading-relaxed max-w-[200px] mx-auto">
                  Reach out for partnerships, support, or generic inquiries.
                </p>
              </div>
            </a>
            
            {/* Appeals & Moderation */}
            <a 
              href="mailto:useen3113@gmail.com?subject=Appeal / Moderation" 
              className="glass p-6 rounded-3xl border border-unseen-800/50 hover:border-unseen-500/55 hover:bg-unseen-950/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(157,78,221,0.15)] flex flex-col justify-center items-center text-center gap-4 block group cursor-pointer"
            >
              <div className="bg-unseen-800 p-4 rounded-full shadow-[0_0_15px_rgba(157,78,221,0.3)] group-hover:bg-unseen-700 transition-colors">
                <MessageCircle className="w-8 h-8 text-unseen-300 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl group-hover:text-unseen-300 transition-colors">Appeals & Moderation</h3>
                <p className="text-sm text-gray-400 mt-1 font-mono">useen3113@gmail.com</p>
                <p className="text-xs text-gray-500 mt-3 font-inter leading-relaxed max-w-[200px] mx-auto">
                  Submit moderation appeal requests or content violations.
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
