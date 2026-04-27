'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Grid3X3, Bookmark, Heart, Lock, UserPlus, UserMinus, Share2, X, Users } from 'lucide-react';
import { useState } from 'react';
import { Conversation, Profile, Message, Post } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { PostCard } from './Feed';

interface ProfilePageProps {
  profile: Profile;
  onBack: () => void;
  onSettingsClick?: () => void;
}

function Avatar({ profile, size = 'lg' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const gradient = profile.avatarGradient || 'from-violet-600 via-purple-600 to-indigo-600';

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${gradient} p-[3px] flex-shrink-0 shadow-lg shadow-indigo-500/20`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${gradient} opacity-40 blur-[3px]`} />
      </div>
    </div>
  );
}

function FollowListModal({ 
  isOpen, 
  onClose, 
  title, 
  profiles,
  onProfileClick,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  profiles: Profile[];
  onProfileClick: (profileId: string) => void;
}) {
  const { isFollowing, followProfile, unfollowProfile } = useApp();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-[#0a0f1c]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-h-[70vh] bg-[#0c1526] rounded-2xl border border-[#1e3a6e]/20 overflow-hidden md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-md md:w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#1e3a6e]/15">
              <h3 className="font-semibold text-[#e0eaff]">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-[#1e3a6e]/30 rounded-full">
                <X className="w-5 h-5 text-[#5a7ab0]" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] scrollbar-hide">
              {profiles.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[#3b5998] opacity-50" />
                  <p className="text-sm text-[#5a7ab0]">No {title.toLowerCase()} yet</p>
                </div>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#142240]/30 transition-colors"
                  >
                    <button onClick={() => { onProfileClick(p.id); onClose(); }}>
                      <Avatar profile={p} size="sm" />
                    </button>
                    <button 
                      onClick={() => { onProfileClick(p.id); onClose(); }}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium text-[#e0eaff]">{p.displayName}</p>
                      <p className="text-xs text-[#5a7ab0]">@{p.username}</p>
                    </button>
                    <motion.button
                      onClick={() => isFollowing(p.id) ? unfollowProfile(p.id) : followProfile(p.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isFollowing(p.id)
                          ? 'bg-[#142240]/60 text-[#a0c4ff] border border-[#1e3a6e]/30'
                          : 'bg-gradient-to-r from-[#3b5ca8] to-[#4a7cc9] text-white'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isFollowing(p.id) ? 'Following' : 'Follow'}
                    </motion.button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ProfilePage({ profile, onBack, onSettingsClick }: ProfilePageProps) {
  const { 
    currentUser, 
    posts, 
    isFollowing, 
    followProfile, 
    unfollowProfile,
    getFollowers,
    getFollowing,
    getSavedPosts,
    profiles,
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  const isOwnProfile = profile.id === currentUser.id || profile.id === 'me';
  const following = isFollowing(profile.id);

  const profilePosts = posts.filter(p => 
    (p.profileId === profile.id || (isOwnProfile && p.profileId === currentUser.id)) && 
    (!p.type || p.type === 'text')
  );

  const savedPostsList = getSavedPosts().filter(p => p.type === 'text');

  const handleFollowToggle = () => {
    if (following) {
      unfollowProfile(profile.id);
    } else {
      followProfile(profile.id);
    }
  };

  const handleProfileClick = (profileId: string) => {
  };

  const displayProfile = isOwnProfile ? currentUser : profile;
  const followersList = getFollowers();
  const followingList = getFollowing();

  return (
    <motion.div
      className="min-h-screen pb-24 md:pb-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#e0eaff]" />
        </button>
        <h1 className="font-medium text-[#e0eaff]">@{displayProfile.username}</h1>
        {isOwnProfile && onSettingsClick ? (
          <button onClick={onSettingsClick} className="p-2 -mr-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-[#7a9fd4]" />
          </button>
        ) : (
          <button className="p-2 -mr-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <Share2 className="w-5 h-5 text-[#7a9fd4]" />
          </button>
        )}
      </div>

      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start gap-5 mb-6">
          <Avatar profile={displayProfile} />
          <div className="flex-1 pt-2">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold text-white tracking-wide">
                {displayProfile.displayName || 'Anonymous Soul'}
              </h2>
              {!isOwnProfile && (
                <motion.button
                  onClick={handleFollowToggle}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all border ${
                    following
                      ? 'bg-transparent text-gray-400 border-gray-600 hover:text-white'
                      : 'bg-gradient-to-r from-[#6a00ff] to-[#ff00ea] text-white border-transparent shadow-[0_0_15px_rgba(106,0,255,0.4)]'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {following ? 'Following' : 'Follow'}
                </motion.button>
              )}
            </div>
            <p className="text-gray-500 text-sm flex items-center gap-1.5 uppercase tracking-widest font-mono text-[10px]">
              <Lock className="w-3 h-3 text-[#00f0ff]" />
              Ghost Identity
            </p>
            {displayProfile.moodTag && (
              <p className="text-xs text-[#00f0ff] mt-2 inline-block px-2 py-1 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/20">{displayProfile.moodTag}</p>
            )}
          </div>
        </div>

        <p className="text-gray-300 mb-8 leading-relaxed text-[15px]">
          {displayProfile.bio || 'A ghost in the machine.'}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center relative group p-[1px] rounded-2xl overflow-hidden cursor-default">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6a00ff] to-[#ff00ea] opacity-20 group-hover:opacity-50 transition-opacity" />
            <div className="bg-black/60 backdrop-blur-md rounded-2xl py-4 border border-white/10 group-hover:border-white/20 transition-all relative z-10 flex flex-col items-center">
              <p className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{displayProfile.postsCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#00f0ff] mt-1 text-center truncate px-1">Drops</p>
            </div>
          </div>
          <button 
            onClick={() => setShowFollowers(true)}
            className="text-center relative group p-[1px] rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6a00ff] to-[#ff00ea] opacity-20 group-hover:opacity-50 transition-opacity" />
            <div className="bg-black/60 backdrop-blur-md rounded-2xl py-4 border border-white/10 group-hover:border-white/20 transition-all relative z-10 flex flex-col items-center">
              <p className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{displayProfile.followersCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#00f0ff] mt-1 text-center truncate px-1">Observers</p>
            </div>
          </button>
          <button 
            onClick={() => setShowFollowing(true)}
            className="text-center relative group p-[1px] rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#6a00ff] to-[#ff00ea] opacity-20 group-hover:opacity-50 transition-opacity" />
            <div className="bg-black/60 backdrop-blur-md rounded-2xl py-4 border border-white/10 group-hover:border-white/20 transition-all relative z-10 flex flex-col items-center">
              <p className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{displayProfile.followingCount}</p>
              <p className="text-[10px] uppercase tracking-widest text-[#00f0ff] mt-1 text-center truncate px-1">Observing</p>
            </div>
          </button>
        </div>

      </div>

      <div className="border-t border-white/10 sticky top-[57px] z-20 bg-black/80 backdrop-blur-xl">
        <div className="flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'posts' 
                ? 'border-[#00f0ff] text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wide uppercase">Drops</span>
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'saved' 
                  ? 'border-[#00f0ff] text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]' 
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-sm font-medium tracking-wide uppercase">Vault</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'posts' ? (
          profilePosts.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 mx-auto mb-4 text-[#3b5998] opacity-50" />
              <p className="text-[#5a7ab0]">No posts yet</p>
              {isOwnProfile && (
                <p className="text-sm text-[#3b5998] mt-2">
                  Share your first anonymous thought
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {profilePosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <PostCard post={post as Post} onProfileClick={handleProfileClick} />
                </motion.div>
              ))}
            </div>
          )
        ) : (
          savedPostsList.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-[#3b5998] opacity-50" />
              <p className="text-[#5a7ab0]">No saved posts</p>
              <p className="text-sm text-[#3b5998] mt-2">
                Save posts to view them later
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedPostsList.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <PostCard post={post as Post} onProfileClick={handleProfileClick} />
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>



      <FollowListModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
        profiles={followersList}
        onProfileClick={handleProfileClick}
      />

      <FollowListModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
        profiles={followingList}
        onProfileClick={handleProfileClick}
      />
    </motion.div>
  );
}
