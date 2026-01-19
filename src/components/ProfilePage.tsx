'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Settings, Grid3X3, Bookmark, Heart, Lock, UserPlus, UserMinus, Share2, X, Users } from 'lucide-react';
import { useState } from 'react';
import { Profile } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';

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

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[3px] flex-shrink-0`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40 blur-[3px]`} />
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
    userPosts, 
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

  const profilePosts = isOwnProfile 
    ? userPosts.filter(p => p.type === 'text')
    : posts.filter(p => p.profileId === profile.id && p.type === 'text');

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
            <h2 className="text-xl font-semibold mb-1 text-[#e0eaff]">{displayProfile.displayName}</h2>
            <p className="text-[#5a7ab0] text-sm flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Anonymous identity
            </p>
            {displayProfile.moodTag && (
              <p className="text-xs text-[#7aa2e3] mt-2">{displayProfile.moodTag}</p>
            )}
          </div>
        </div>

        <p className="text-[#a0c4ff] mb-6 leading-relaxed text-[15px]">{displayProfile.bio}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center glass rounded-xl py-3.5 hover:bg-[#1e3a6e]/20 transition-colors cursor-default">
            <p className="text-xl font-bold text-[#e0eaff]">{displayProfile.postsCount}</p>
            <p className="text-xs text-[#5a7ab0]">Posts</p>
          </div>
          <button 
            onClick={() => setShowFollowers(true)}
            className="text-center glass rounded-xl py-3.5 hover:bg-[#1e3a6e]/30 transition-colors"
          >
            <p className="text-xl font-bold text-[#e0eaff]">{displayProfile.followersCount}</p>
            <p className="text-xs text-[#5a7ab0]">Followers</p>
          </button>
          <button 
            onClick={() => setShowFollowing(true)}
            className="text-center glass rounded-xl py-3.5 hover:bg-[#1e3a6e]/30 transition-colors"
          >
            <p className="text-xl font-bold text-[#e0eaff]">{displayProfile.followingCount}</p>
            <p className="text-xs text-[#5a7ab0]">Following</p>
          </button>
        </div>

        {!isOwnProfile && (
          <div className="hidden md:flex gap-3">
            <motion.button
              onClick={handleFollowToggle}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                following 
                  ? 'bg-[#142240]/60 text-[#a0c4ff] border border-[#1e3a6e]/30 hover:bg-[#1a2d50]/70' 
                  : 'bg-gradient-to-r from-[#3b5ca8] to-[#4a7cc9] text-white shadow-lg shadow-[#4a7cc9]/20'
              }`}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
            >
              {following ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </motion.button>
            <motion.button
              className="px-6 py-3 rounded-xl bg-[#142240]/60 text-[#a0c4ff] border border-[#1e3a6e]/30 font-medium hover:bg-[#1a2d50]/70 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              Message
            </motion.button>
          </div>
        )}
      </div>

      <div className="border-t border-[#1e3a6e]/15 sticky top-[57px] z-20 bg-[#0a0f1c]/95 backdrop-blur-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'posts' 
                ? 'border-[#4a7cc9] text-[#7aa2e3]' 
                : 'border-transparent text-[#5a7ab0] hover:text-[#7a9fd4]'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-sm font-medium">Posts</span>
          </button>
          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${
                activeTab === 'saved' 
                  ? 'border-[#4a7cc9] text-[#7aa2e3]' 
                  : 'border-transparent text-[#5a7ab0] hover:text-[#7a9fd4]'
              }`}
            >
              <Bookmark className="w-5 h-5" />
              <span className="text-sm font-medium">Saved</span>
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
            <div className="space-y-4">
              {profilePosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="glass rounded-2xl p-5 hover:bg-[#142240]/40 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <p className="text-[#c4d9ff] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1e3a6e]/10">
                    <span className="text-xs text-[#5a7ab0]">{post.timestamp}</span>
                    <span className="text-xs text-[#5a7ab0] flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes}
                    </span>
                    <span className="text-xs text-[#5a7ab0]">{post.comments} comments</span>
                  </div>
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
            <div className="space-y-4">
              {savedPostsList.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="glass rounded-2xl p-5 hover:bg-[#142240]/40 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <p className="text-[#c4d9ff] leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#1e3a6e]/10">
                    <span className="text-xs text-[#5a7ab0]">{post.timestamp}</span>
                    <span className="text-xs text-[#5a7ab0] flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {post.likes}
                    </span>
                    <span className="text-xs text-[#5a7ab0]">{post.comments} comments</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {!isOwnProfile && (
        <div className="mobile-follow-fixed">
          <motion.button
            onClick={handleFollowToggle}
            className={`w-full py-3.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              following 
                ? 'bg-[#142240]/80 text-[#a0c4ff] border border-[#1e3a6e]/30' 
                : 'bg-gradient-to-r from-[#3b5ca8] to-[#4a7cc9] text-white shadow-lg shadow-[#4a7cc9]/20'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {following ? (
              <>
                <UserMinus className="w-5 h-5" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Follow
              </>
            )}
          </motion.button>
        </div>
      )}

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
