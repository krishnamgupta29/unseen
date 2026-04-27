'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Lock } from 'lucide-react';
import { Profile } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';

interface ExplorePageProps {
  onProfileClick: (profileId: string) => void;
}

function Avatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[2px] flex-shrink-0`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40 blur-[1px]`} />
      </div>
    </div>
  );
}

export function ExplorePage({ onProfileClick }: ExplorePageProps) {
  const { profiles, posts, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = profiles.filter(p => 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-4"
    >
      {/* Floating Smart Search */}
      <div className="sticky top-0 z-20 px-4 py-4 mb-4 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="relative group max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#00f0ff] transition-colors" />
          <input
            type="text"
            placeholder="Search signals, identities, frequencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all shadow-lg"
          />
        </div>
      </div>

      {searchTerm && (
        <div className="px-4 mb-8 max-w-2xl mx-auto">
          <h2 className="font-semibold mb-4 text-white/80 tracking-wide uppercase text-xs">Identities Found</h2>
          {filteredProfiles.length > 0 ? (
            <div className="space-y-3">
              {filteredProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onProfileClick(p.id)}
                  className="flex items-center gap-3 w-full p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-[#00f0ff]/30 transition-all duration-300 group"
                >
                  <Avatar profile={p} size="sm" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-[#00f0ff] transition-colors">{p.displayName}</p>
                    <p className="text-xs text-gray-500">@{p.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-8 bg-black/20 rounded-2xl border border-white/5">No identities matched the frequency.</p>
          )}
        </div>
      )}

      {!searchTerm && (
        <>
          {/* Trending Section */}
          {profiles.length > 5 && (
            <div className="px-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#ff00ea]" />
                <h2 className="font-semibold text-white/80 tracking-wide uppercase text-xs">High Frequency Signals</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {/* Dynamic tags could go here */}
              </div>
            </div>
          )}

          {/* Discover Section */}
          <div className="px-4 mb-10 max-w-2xl mx-auto">
            <h2 className="font-semibold mb-4 text-white/80 tracking-wide uppercase text-xs">
              {profiles.length > 1 ? 'Discover Identities' : 'Welcome to UNSEEN'}
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {profiles.filter(p => p.id !== currentUser.id).length > 0 ? (
                profiles.filter(p => p.id !== currentUser.id).map((profile, index) => (
                  <motion.button
                    key={profile.id}
                    onClick={() => onProfileClick(profile.id)}
                    className="flex flex-col items-center gap-2 flex-shrink-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="p-1 rounded-full bg-gradient-to-br from-white/10 to-white/5 group-hover:from-[#6a00ff]/50 group-hover:to-[#ff00ea]/50 transition-colors">
                      <Avatar profile={profile} />
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-white max-w-[70px] truncate transition-colors">
                      {profile.displayName}
                    </span>
                  </motion.button>
                ))
              ) : (
                <p className="text-sm text-gray-600 italic">
                  Radar is empty. Wait for others to join the network.
                </p>
              )}
            </div>
          </div>
        </>
      )}



      <div className="px-4 mt-12 mb-10 max-w-md mx-auto">
        <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-center shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
          <Lock className="w-6 h-6 text-[#00f0ff] mx-auto mb-4 drop-shadow-[0_0_8px_rgba(0,240,255,0.6)] animate-pulse" />
          <h3 className="font-medium text-sm mb-2 text-white tracking-widest uppercase">Secure Zone</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-[250px] mx-auto">
            Everything here is encrypted and fully anonymous. Trust the network.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
