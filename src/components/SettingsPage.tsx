'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Shield, AlertTriangle, LogOut, Trash2, Camera, Lock, Zap, EyeOff, FileText, MessageSquare, HelpCircle, KeyRound } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

type TabId = 'account' | 'security' | 'danger';

export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const { currentUser, updateProfile } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  
  // Danger Zone States
  const [deleteProgress, setDeleteProgress] = useState(0);
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSaveProfile = () => {
    updateProfile({
      displayName,
      bio,
    });
    // Add toast or feedback
  };

  const startDeleteHold = () => {
    setDeleteProgress(0);
    deleteIntervalRef.current = setInterval(() => {
      setDeleteProgress(prev => {
        if (prev >= 100) {
          clearInterval(deleteIntervalRef.current!);
          onLogout(); // Mock deleting account by logging out
          return 100;
        }
        return prev + 2; // 50 steps = 100% (runs every 60ms ≈ 3 seconds)
      });
    }, 60);
  };

  const cancelDeleteHold = () => {
    if (deleteIntervalRef.current) {
      clearInterval(deleteIntervalRef.current);
    }
    setDeleteProgress(0);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (deleteIntervalRef.current) clearInterval(deleteIntervalRef.current);
    };
  }, []);

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Identity', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <motion.div
      className="min-h-screen pb-20"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="bg-black/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase text-sm">Control Panel</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex flex-col items-center gap-2 rounded-xl transition-all relative ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabSettings"
                    className={`absolute inset-0 rounded-xl ${tab.id === 'danger' ? 'bg-red-500/20 border border-red-500/50' : 'bg-white/10 border border-white/20'}`}
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <Icon className={`w-5 h-5 ${isActive && tab.id === 'danger' ? 'text-red-400' : ''}`} />
                  <span className="text-[10px] uppercase tracking-widest font-bold">{tab.label}</span>
                </div>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'account' && (
            <motion.div 
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-center mb-8">
                <div className="relative group cursor-pointer">
                  <div className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${currentUser?.avatarGradient || 'from-violet-600 via-purple-600 to-indigo-600'} p-1 rotate-3 group-hover:rotate-6 transition-transform shadow-[0_0_30px_rgba(106,0,255,0.3)]`}>
                    <div className="w-full h-full rounded-[1.8rem] bg-black flex items-center justify-center overflow-hidden">
                      <div className={`w-[80%] h-[80%] rounded-[1.5rem] bg-gradient-to-br ${currentUser?.avatarGradient || 'from-violet-600 via-purple-600 to-indigo-600'} opacity-50 blur-sm`} />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-[2rem]">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-medium">Public Alias</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block font-medium">Cryptographic Signature (Bio)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-white resize-none focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all custom-scrollbar"
                  />
                </div>

                <motion.button 
                  onClick={handleSaveProfile}
                  className="w-full py-4 bg-gradient-to-r from-[#6a00ff] to-[#ff00ea] rounded-xl text-white font-bold tracking-widest uppercase text-xs shadow-[0_0_20px_rgba(106,0,255,0.4)] hover:shadow-[0_0_30px_rgba(106,0,255,0.6)] transition-all"
                  whileTap={{ scale: 0.98 }}
                >
                  Sync Identity
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {[
                { icon: Shield, name: "Security Center", desc: "Manage your 2FA, connected devices, and active login sessions." },
                { icon: FileText, name: "Privacy Policy", desc: "Read how we encrypt and protect your ghostly identity on the network." },
                { icon: MessageSquare, name: "Feedback", desc: "Suggest features or report signal drops directly to the developers." },
                { icon: HelpCircle, name: "Support", desc: "Get help with technical issues or account related problems." }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl gap-4 hover:border-[#00f0ff]/30 transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-[#00f0ff]/20 transition-colors">
                      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-[#00f0ff] transition-colors" />
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1 tracking-wide">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180 group-hover:text-[#00f0ff] transition-colors" />
                </div>
              ))}

              <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-2xl p-5 mt-6">
                <div className="flex items-center gap-3 mb-2">
                  <KeyRound className="w-5 h-5 text-[#00f0ff]" />
                  <h3 className="text-[#00f0ff] font-medium tracking-wide">Recovery Method</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Send all your identity details to the provided Support email. Email access is essential for processing your recovery request securely. You will receive a direct reply from our team once verified.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'danger' && (
            <motion.div 
              key="danger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h3 className="text-red-400 font-medium tracking-wide">Warning</h3>
                </div>
                <p className="text-sm text-red-400/70 leading-relaxed">These actions are irreversible. Severing your connection will permanently erase your identity from the network ghosts.</p>
              </div>

              <motion.button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-gray-400 group-hover:text-white" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="text-white font-medium">Disconnect Identity</h4>
                  <p className="text-xs text-gray-500">Log out from this device</p>
                </div>
              </motion.button>

              <div className="relative">
                <motion.button
                  onPointerDown={startDeleteHold}
                  onPointerUp={cancelDeleteHold}
                  onPointerLeave={cancelDeleteHold}
                  className="w-full flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden group select-none relative"
                  animate={{ scale: deleteProgress > 0 ? 0.95 : 1 }}
                >
                  {/* Progress fill background */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-red-500/20"
                    style={{ width: `${deleteProgress}%`, transition: 'width 0.1s linear' }}
                  />

                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center relative z-10 group-hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left flex-1 relative z-10">
                    <h4 className="text-red-500 font-medium tracking-wide uppercase text-sm">Purge Identity</h4>
                    <p className="text-xs text-red-400/50 mt-1">{deleteProgress > 0 ? `Hold to confirm... ${Math.floor(deleteProgress)}%` : 'Hold for 3 seconds to erase account'}</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] uppercase tracking-widest text-gray-600 mt-12 mb-8">
          UNSEEN PROTOCOL v2.0
        </p>
      </div>
    </motion.div>
  );
}
