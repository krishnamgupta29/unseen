'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Lock, Bell, Moon, HelpCircle, LogOut, ChevronRight, Shield, Palette, Edit3, Check } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface SettingsPageProps {
  onBack: () => void;
  onLogout: () => void;
}

const themeOptions = [
  { id: 'blue', gradient: 'from-[#2a4d8f] to-[#4a7cc9]', name: 'Midnight Blue', preview: '#4a7cc9' },
  { id: 'purple', gradient: 'from-[#5a3d8f] to-[#8a6cc9]', name: 'Twilight', preview: '#8a6cc9' },
  { id: 'teal', gradient: 'from-[#2d6b7a] to-[#4ca8b8]', name: 'Ocean', preview: '#4ca8b8' },
  { id: 'rose', gradient: 'from-[#8f3d5a] to-[#c96c8a]', name: 'Dusk Rose', preview: '#c96c8a' },
  { id: 'emerald', gradient: 'from-[#16a34a] to-[#4ade80]', name: 'Forest', preview: '#4ade80' },
] as const;

type ThemeId = typeof themeOptions[number]['id'];

export function SettingsPage({ onBack, onLogout }: SettingsPageProps) {
  const { currentUser, updateProfile, theme, setTheme } = useApp();
  const [activeSection, setActiveSection] = useState<'main' | 'edit' | 'theme'>('main');
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio);

  const handleSaveProfile = () => {
    updateProfile({
      displayName,
      bio,
    });
    setActiveSection('main');
  };

  const handleThemeChange = (newTheme: ThemeId) => {
    setTheme(newTheme);
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile', action: () => setActiveSection('edit') },
        { icon: Lock, label: 'Privacy', action: () => {} },
        { icon: Shield, label: 'Security', action: () => {} },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Moon, label: 'Appearance', action: () => {} },
        { icon: Palette, label: 'Theme Color', action: () => setActiveSection('theme') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', action: () => {} },
      ],
    },
  ];

  if (activeSection === 'edit') {
    return (
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setActiveSection('main')} className="p-2 -ml-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#e0eaff]" />
          </button>
          <h1 className="font-medium text-[#e0eaff]">Edit Profile</h1>
          <button 
            onClick={handleSaveProfile}
            className="text-[#7aa2e3] font-medium text-sm hover:text-[#9ab8ed] transition-colors"
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${currentUser.avatarGradient} p-[3px]`}>
                <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
                  <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${currentUser.avatarGradient} opacity-40`} />
                </div>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#4a7cc9] rounded-full flex items-center justify-center shadow-lg">
                <Edit3 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-[#5a7ab0] mb-2 block font-medium">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-xl py-3.5 px-4 text-[#e0eaff] focus:outline-none focus:border-[#4a7cc9]/50 transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-[#5a7ab0] mb-2 block font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-xl py-3.5 px-4 text-[#e0eaff] resize-none focus:outline-none focus:border-[#4a7cc9]/50 transition-colors"
            />
            <p className="text-xs text-[#5a7ab0] mt-2 text-right">{bio.length}/200</p>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#5a7ab0]" />
              <div>
                <p className="text-sm text-[#a0c4ff]">Your identity is protected</p>
                <p className="text-xs text-[#5a7ab0]">Only your display name is visible to others</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (activeSection === 'theme') {
    return (
      <motion.div
        className="min-h-screen"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
      >
        <div className="glass-strong px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setActiveSection('main')} className="p-2 -ml-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#e0eaff]" />
          </button>
          <h1 className="font-medium text-[#e0eaff]">Theme Color</h1>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#5a7ab0] mb-4">
            Choose a color theme that matches your vibe
          </p>

          <div className="space-y-3">
            {themeOptions.map((option, index) => (
              <motion.button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                  theme === option.id 
                    ? 'border-[#4a7cc9] bg-[#1e3a6e]/30' 
                    : 'border-[#1e3a6e]/20 bg-[#142240]/30 hover:bg-[#142240]/50'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} shadow-lg`} 
                  style={{ boxShadow: `0 4px 20px ${option.preview}30` }}
                />
                <div className="flex-1 text-left">
                  <p className="text-[#e0eaff] font-medium">{option.name}</p>
                  <p className="text-xs text-[#5a7ab0]">{option.id === theme ? 'Currently active' : 'Tap to apply'}</p>
                </div>
                {theme === option.id && (
                  <motion.div
                    className="w-6 h-6 rounded-full bg-[#4a7cc9] flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="glass rounded-xl p-4 mt-6">
            <p className="text-xs text-[#5a7ab0] text-center">
              Theme changes will be applied across the entire app instantly
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="glass-strong px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#e0eaff]" />
        </button>
        <h1 className="font-medium text-[#e0eaff]">Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        <motion.div 
          className="glass rounded-2xl p-4 flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${currentUser.avatarGradient} p-[2px]`}>
            <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
              <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${currentUser.avatarGradient} opacity-40`} />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#e0eaff]">{currentUser.displayName}</p>
            <p className="text-sm text-[#5a7ab0]">@{currentUser.username}</p>
          </div>
          <button 
            onClick={() => setActiveSection('edit')}
            className="px-3 py-1.5 bg-[#142240]/60 rounded-lg text-xs text-[#7aa2e3] font-medium hover:bg-[#1a2d50]/70 transition-colors"
          >
            Edit
          </button>
        </motion.div>

        {settingsSections.map((section, sectionIndex) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h3 className="text-xs font-medium text-[#5a7ab0] uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="glass rounded-2xl overflow-hidden divide-y divide-[#1e3a6e]/10">
              {section.items.map((item, index) => (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center gap-4 px-4 py-4 hover:bg-[#142240]/30 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (sectionIndex * 0.1) + (index * 0.05) }}
                >
                  <item.icon className="w-5 h-5 text-[#7a9fd4]" />
                  <span className="flex-1 text-left text-[#e0eaff]">{item.label}</span>
                  {item.label === 'Theme Color' && (
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${
                      themeOptions.find(t => t.id === theme)?.gradient || themeOptions[0].gradient
                    }`} />
                  )}
                  <ChevronRight className="w-5 h-5 text-[#3b5998]" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-4 py-4 glass rounded-2xl text-[#c45d5d] hover:bg-[#c45d5d]/10 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <LogOut className="w-5 h-5" />
          <span className="flex-1 text-left">Log Out</span>
        </motion.button>

        <p className="text-center text-xs text-[#3b5998] pt-4 pb-8">
          UNSEEN v1.0 · Privacy-first anonymous social
        </p>
      </div>
    </motion.div>
  );
}
