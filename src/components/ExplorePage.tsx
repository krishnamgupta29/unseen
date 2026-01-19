'use client';

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
  const { profiles, posts } = useApp();

  const trendingTopics = [
    { tag: '#RaatKiBaat', posts: '12.4K' },
    { tag: '#DilKiSuno', posts: '8.9K' },
    { tag: '#AnonymousConfessions', posts: '6.2K' },
    { tag: '#HealingJourney', posts: '5.1K' },
    { tag: '#3amThoughts', posts: '4.8K' },
    { tag: '#ChuppiTod', posts: '3.9K' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-4"
    >
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a7ab0]" />
          <input
            type="text"
            placeholder="Dhoondo... thoughts, voices, souls..."
            className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-full py-3.5 pl-12 pr-4 text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none focus:border-[#4a7cc9]/40 transition-all"
          />
        </div>
      </div>

      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#7aa2e3]" />
          <h2 className="font-semibold text-[#e0eaff]">Abhi chal raha hai</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {trendingTopics.map((topic, index) => (
            <motion.button
              key={topic.tag}
              className="flex-shrink-0 px-4 py-2.5 bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-full hover:border-[#4a7cc9]/40 hover:bg-[#1a2d50]/50 transition-all"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="text-sm text-[#7aa2e3]">{topic.tag}</span>
              <span className="text-xs text-[#5a7ab0] ml-2">{topic.posts}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-8">
        <h2 className="font-semibold mb-4 text-[#e0eaff]">Awaazein Discover Karo</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {profiles.map((profile, index) => (
            <motion.button
              key={profile.id}
              onClick={() => onProfileClick(profile.id)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-1 rounded-full bg-gradient-to-br from-[#2a4d8f]/40 to-[#3b5ca8]/40">
                <Avatar profile={profile} />
              </div>
              <span className="text-xs text-[#7a9fd4] max-w-[70px] truncate">
                {profile.displayName}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <h2 className="font-semibold mb-4 text-[#e0eaff]">Popular Thoughts</h2>
        <div className="grid grid-cols-2 gap-3">
          {posts
            .filter(p => p.type === 'text')
            .slice(0, 6)
            .map((post, index) => (
              <motion.div
                key={post.id}
                className="aspect-square bg-gradient-to-br from-[#1e3a6e]/20 to-[#2a4d8f]/20 rounded-2xl p-4 flex items-center justify-center border border-[#1e3a6e]/15 hover:border-[#4a7cc9]/30 cursor-pointer transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <p className="text-sm text-[#a0c4ff] text-center line-clamp-5 leading-relaxed">
                  {post.content}
                </p>
              </motion.div>
            ))}
        </div>
      </div>

      <div className="px-4 mt-8">
        <div className="glass rounded-2xl p-5 text-center">
          <Lock className="w-6 h-6 text-[#5a7ab0] mx-auto mb-3" />
          <h3 className="font-medium text-sm mb-1 text-[#e0eaff]">Anonymous Space</h3>
          <p className="text-xs text-[#5a7ab0] leading-relaxed">
            Yaha sab anonymous hai. Khul ke bolo, judge nahi kiya jaata.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
