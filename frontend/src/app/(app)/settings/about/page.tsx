'use client';

import Header from '@/components/layout/Header';
import { Shield, Zap, Lock, EyeOff } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen pb-20">
      <Header title="About Unseen" showBack />
      
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
        
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-500 tracking-wide mb-4">
            UNSEEN
          </h1>
          <p className="text-lg text-gray-400 font-inter max-w-2xl mx-auto">
            The social network built for the shadows. Speak your truth, share your darkest confessions, and connect with people on a purely intellectual level. No face, no bias, no judgment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-3xl border border-unseen-800/50 hover:bg-unseen-900/30 transition-colors">
            <EyeOff className="w-10 h-10 text-unseen-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Total Anonymity</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your identity is stripped away. We believe society places too much emphasis on who is speaking rather than what is being said. Here, your voice is all that matters.
            </p>
          </div>
          
          <div className="glass p-8 rounded-3xl border border-unseen-800/50 hover:bg-unseen-900/30 transition-colors">
            <Shield className="w-10 h-10 text-unseen-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">AI Moderation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Freedom of speech isn't freedom from consequences. Our intelligent AI systems actively monitor for hate speech, bullying, and illegal content to keep the shadows safe.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border border-unseen-800/50 hover:bg-unseen-900/30 transition-colors">
            <Lock className="w-10 h-10 text-unseen-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Encrypted Vault</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Everything you save to your Vault, and every private message you send, is heavily encrypted. What happens in the dark, stays in the dark.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl border border-unseen-800/50 hover:bg-unseen-900/30 transition-colors">
            <Zap className="w-10 h-10 text-unseen-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Instant Global Reach</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              When you post, everyone sees it instantly. Posts immediately reach the global feed, allowing you to find your community right away.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500 font-inter">
          <p>Version 2.4.0 (Build 4920)</p>
          <p className="mt-2">Developed by the deep web community.</p>
        </div>
      </div>
    </div>
  );
}
