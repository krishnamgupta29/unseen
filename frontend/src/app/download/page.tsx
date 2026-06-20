'use client';

import { useEffect, useState } from 'react';
import { Download, ArrowLeft, Shield, CheckCircle, Smartphone, AlertCircle, Info, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DownloadPage() {
  const [downloadState, setDownloadState] = useState<'idle' | 'preparing' | 'downloading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);

  const startDownloadFlow = () => {
    if (downloadState !== 'idle') return;
    
    setDownloadState('preparing');
    
    // 1. Prepare download (1s)
    setTimeout(() => {
      setDownloadState('downloading');
      
      // 2. Animate progress bar (2s)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            
            // 3. Trigger actual file download
            if (typeof window !== 'undefined' && (window as any).AndroidInterface && (window as any).AndroidInterface.openInBrowser) {
              (window as any).AndroidInterface.openInBrowser('https://unseen-world.vercel.app/unseen.apk');
            } else {
              const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';
              const isApkUA = ua.includes('UnseenAndroidAPK') || ua.includes('UnseenAPK');
              if (isApkUA) {
                window.location.href = 'https://unseen-world.vercel.app/unseen.apk';
              } else {
                const link = document.createElement('a');
                link.href = '/unseen.apk';
                link.setAttribute('download', 'unseen.apk');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
            
            setDownloadState('completed');
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }, 1000);
  };

  // Auto-start download after 1 second
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      startDownloadFlow();
    }, 1000);
    return () => clearTimeout(autoTimer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col justify-between overflow-x-hidden relative font-inter select-none">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#7b2cbf]/20 to-transparent blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#ff0a54]/10 to-transparent blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#3c096c]/15 blur-[100px] pointer-events-none" />
      </div>

      {/* Decorative Grid Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(#9d4edd 1px, transparent 1px), radial-gradient(#9d4edd 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }}
      />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 md:px-12 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center space-x-2 group">
          <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-unseen-300 transition-colors" />
          <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Return Home</span>
        </Link>
        <div className="text-xl font-poppins font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-unseen-200 to-unseen-400">
          UNSEEN
        </div>
      </header>

      {/* Main Showcase Grid */}
      <main className="flex-1 flex items-center justify-center py-12 px-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Column: Premium Interactive Mockup */}
          <div className="col-span-1 lg:col-span-6 flex flex-col items-center justify-center relative">
            {/* Glowing Orb Behind Phone */}
            <div className="absolute w-[280px] h-[280px] rounded-full bg-gradient-to-r from-[#9d4edd] to-[#ff0a54] opacity-20 blur-[60px] animate-pulse pointer-events-none" />
            
            {/* Holographic Cyber-phone Mockup Container */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative w-[270px] h-[540px] rounded-[48px] border-[6px] border-unseen-800/80 bg-[#090216] shadow-[0_0_50px_rgba(157,78,221,0.25)] p-3 overflow-hidden flex flex-col justify-between group"
            >
              {/* Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center">
                <span className="w-2.5 h-2.5 bg-[#0a0518] rounded-full border border-gray-900" />
              </div>

              {/* Inner Glowing Screen Borders */}
              <div className="absolute inset-0 border border-unseen-500/20 rounded-[40px] pointer-events-none z-20" />

              {/* Futuristic UI Screen Content */}
              <div className="flex-1 flex flex-col justify-between pt-8 pb-4 relative z-10">
                {/* Simulated Header */}
                <div className="px-4 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-unseen-400">SECURE SHELL v1.0</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                </div>

                {/* Simulated Chat Feed / UI Preview */}
                <div className="flex-1 flex flex-col justify-center px-4 space-y-4">
                  <div className="p-3 bg-unseen-950/80 border border-unseen-800/60 rounded-2xl space-y-1.5 shadow-md">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff0a54]" />
                      <span className="text-[9px] font-bold text-gray-300">Anonymous User</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-inter">Share your thoughts anonymously. No judgment, no trace.</p>
                  </div>
                  
                  <div className="p-3 bg-unseen-900/40 border border-unseen-700/30 rounded-2xl space-y-2 shadow-md">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-unseen-400 to-unseen-600" />
                      <span className="text-[9px] font-bold text-gray-200">Privacy Active</span>
                    </div>
                    <div className="h-1 w-full bg-unseen-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-unseen-500 to-unseen-300 w-[75%]" />
                    </div>
                  </div>
                </div>

                {/* Simulated TabBar */}
                <div className="px-4 py-2 border-t border-unseen-950 flex justify-around items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-unseen-400 opacity-60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-unseen-400 opacity-60" />
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-unseen-400 to-unseen-600 border border-black shadow-[0_0_8px_rgba(157,78,221,0.6)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-unseen-400 opacity-60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-unseen-400 opacity-60" />
                </div>
              </div>

              {/* Decorative Screen Glare */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
            </motion.div>
          </div>

          {/* Right Column: Premium Download Interactive Card */}
          <div className="col-span-1 lg:col-span-6 flex flex-col justify-center">
            
            {/* Floating Title Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3.5 py-1.5 bg-unseen-900/60 border border-unseen-700/40 rounded-full text-xs font-semibold text-unseen-300 flex items-center gap-1.5 shadow-md">
                <Zap className="w-3.5 h-3.5 text-unseen-400" /> Premium Native Build
              </span>
              <span className="px-3.5 py-1.5 bg-[#ff0a54]/5 border border-[#ff0a54]/20 rounded-full text-xs font-semibold text-[#ff0a54] flex items-center gap-1.5 shadow-md">
                <Shield className="w-3.5 h-3.5" /> Ad-Free & Encrypted
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-poppins font-black leading-tight tracking-tight mb-4">
              Unlock the Ultimate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-unseen-300 via-unseen-400 to-[#ff0a54] filter drop-shadow-[0_0_30px_rgba(157,78,221,0.4)]">
                Unseen Experience.
              </span>
            </h1>

            <p className="text-gray-400 font-inter text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Get the native Android app for faster feeds, smoother animations, realtime background notifications, and secure hardware-level encryption.
            </p>

            {/* Premium Download Box */}
            <div className="glass-strong p-6 md:p-8 rounded-[32px] border border-unseen-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#9d4edd] to-transparent" />
              
              <AnimatePresence mode="wait">
                {downloadState === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center text-sm border-b border-unseen-900 pb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">File Metadata</p>
                        <p className="text-white font-bold text-base mt-0.5">unseen-stable.apk</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Size</p>
                        <p className="text-unseen-300 font-bold font-mono text-base mt-0.5">4.1 MB</p>
                      </div>
                    </div>

                    <button 
                      onClick={startDownloadFlow}
                      className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-unseen-600 via-unseen-700 to-unseen-800 text-white font-bold shadow-[0_0_20px_rgba(123,44,191,0.3)] hover:shadow-[0_0_35px_rgba(157,78,221,0.6)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-wider text-xs cursor-pointer border border-unseen-500/30"
                    >
                      <Download className="w-5 h-5" /> Start Download
                    </button>
                  </motion.div>
                )}

                {downloadState === 'preparing' && (
                  <motion.div 
                    key="preparing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-center space-y-4"
                  >
                    <Loader2 className="w-10 h-10 text-unseen-400 animate-spin" />
                    <div>
                      <h3 className="font-poppins font-bold text-lg text-white">Establishing Secure Tunnel</h3>
                      <p className="text-xs text-gray-500 mt-1 font-mono">Connecting to edge servers...</p>
                    </div>
                  </motion.div>
                )}

                {downloadState === 'downloading' && (
                  <motion.div 
                    key="downloading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4 py-3"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-mono text-xs">Downloading Secure Payload...</span>
                      <span className="text-unseen-300 font-bold font-mono">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-unseen-950 rounded-full overflow-hidden border border-unseen-900">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#7b2cbf] via-[#9d4edd] to-[#ff0a54] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </motion.div>
                )}

                {downloadState === 'completed' && (
                  <motion.div 
                    key="completed"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-5 text-center flex flex-col items-center justify-center py-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-poppins font-bold text-lg text-white">Download Completed!</h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed mt-1">
                        If the download didn't start automatically, tap the button below to restart it.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setProgress(0); setDownloadState('idle'); startDownloadFlow(); }}
                      className="text-xs font-mono font-bold text-unseen-400 hover:text-white transition-colors flex items-center gap-1 mt-2 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Redownload APK
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-unseen-950/40 border border-unseen-900/40 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Compatible</p>
                <p className="text-white font-bold text-sm mt-1">Android 8.0+</p>
              </div>
              <div className="bg-unseen-950/40 border border-unseen-900/40 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Current Build</p>
                <p className="text-white font-bold text-sm mt-1">v1.0.0 (Prod)</p>
              </div>
              <div className="bg-unseen-950/40 border border-unseen-900/40 rounded-2xl p-4 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">SHA-256</p>
                <p className="text-green-400 font-bold text-sm mt-1 flex items-center justify-center gap-1 font-mono">
                  <Shield className="w-3.5 h-3.5" /> OK
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Dynamic Installation Guide Slider / Accordion */}
      <section className="w-full max-w-5xl mx-auto px-6 mb-16 relative z-10">
        <div className="glass p-8 rounded-[36px] border border-unseen-800/40 shadow-xl">
          <h2 className="text-xl md:text-2xl font-poppins font-bold text-white mb-6 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
            <Smartphone className="w-5 h-5 text-unseen-400" /> 3 Steps to Get Started
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex gap-4 p-4 hover:bg-unseen-900/20 rounded-2xl transition-colors border border-transparent hover:border-unseen-800/30">
              <span className="w-8 h-8 rounded-full bg-unseen-900 flex items-center justify-center text-unseen-300 font-mono font-bold shrink-0 border border-unseen-800">1</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Download APK</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Download the secure `.apk` installer payload directly to your phone storage.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 hover:bg-unseen-900/20 rounded-2xl transition-colors border border-transparent hover:border-unseen-800/30">
              <span className="w-8 h-8 rounded-full bg-unseen-900 flex items-center justify-center text-unseen-300 font-mono font-bold shrink-0 border border-unseen-800">2</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Allow Unknown Sources</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Open settings, toggle "Allow Installation from Unknown Sources" on your mobile browser.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 hover:bg-unseen-900/20 rounded-2xl transition-colors border border-transparent hover:border-unseen-800/30">
              <span className="w-8 h-8 rounded-full bg-unseen-900 flex items-center justify-center text-unseen-300 font-mono font-bold shrink-0 border border-unseen-800">3</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Run and Connect</h4>
                <p className="text-xs text-gray-400 leading-relaxed">Launch the app, create your account, and start posting anonymously.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-unseen-950 text-xs text-gray-500 font-mono relative z-10 shrink-0">
        <p>© {new Date().getFullYear()} Unseen Protocol. Distributed cryptographically.</p>
      </footer>

    </div>
  );
}
