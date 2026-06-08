'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DownloadPage() {
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    // Wait 1.5 seconds so the user sees the page, then trigger the download automatically
    const timer = setTimeout(() => {
      const link = document.createElement('a');
      link.href = '/unseen.apk';
      link.setAttribute('download', 'unseen.apk');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadStarted(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080016] text-white px-4 relative select-none overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-unseen-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-unseen-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass p-8 md:p-12 rounded-3xl w-full max-w-md border border-unseen-700/40 shadow-[0_0_50px_rgba(36,0,70,0.6)] text-center relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-unseen-400 to-transparent" />

        <div className="mx-auto w-16 h-16 bg-unseen-900/60 border border-unseen-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(157,78,221,0.2)]">
          {downloadStarted ? (
            <Download className="w-8 h-8 text-unseen-300 animate-bounce" />
          ) : (
            <Loader2 className="w-8 h-8 text-unseen-400 animate-spin" />
          )}
        </div>

        <h1 className="text-2xl font-bold font-poppins text-white mb-3 tracking-tight">
          {downloadStarted ? 'Download Initiated!' : 'Preparing Secure Node...'}
        </h1>

        <p className="text-gray-400 text-sm font-inter leading-relaxed mb-8">
          {downloadStarted 
            ? 'Your download has started. If the download did not start automatically, please click the button below to retry.' 
            : 'Thank you for choosing Unseen. Connecting to secure distribution protocols to download the official Android APK.'}
        </p>

        {/* Action Button */}
        <a 
          href="/unseen.apk" 
          download 
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-unseen-600 via-unseen-700 to-unseen-800 text-white font-semibold shadow-[0_0_20px_rgba(123,44,191,0.3)] hover:shadow-[0_0_30px_rgba(123,44,191,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
        >
          <Download className="w-4 h-4" /> Download Manually
        </a>

        {/* Security assurance */}
        <div className="mt-8 pt-6 border-t border-unseen-800/40 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
          <Shield className="w-3.5 h-3.5 text-unseen-400 opacity-60" />
          <span>Verified Secure: SHA-256 Symmetric Protected</span>
        </div>
      </motion.div>

      {/* Navigation help */}
      <Link 
        href="/" 
        className="mt-8 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to home page
      </Link>
    </div>
  );
}
