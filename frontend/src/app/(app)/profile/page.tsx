'use client';

import { Settings, Grid, Bookmark, X, Edit3, Shield, UserPlus, Info, Check, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import PostCard from '@/components/PostCard';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { users, auth } from '@/lib/api';
import { getSocket } from '@/lib/socketClient';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

const PostSkeleton = () => (
  <div className="p-6 border-b border-unseen-800/30 animate-pulse">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-10 h-10 rounded-full bg-unseen-900/60" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-unseen-800/50 rounded w-1/4" />
        <div className="h-2 bg-unseen-800/30 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2 mb-6">
      <div className="h-3 bg-unseen-800/50 rounded w-full" />
      <div className="h-3 bg-unseen-800/50 rounded w-5/6" />
    </div>
    <div className="flex space-x-12">
      <div className="h-4 bg-unseen-800/40 rounded w-12" />
      <div className="h-4 bg-unseen-800/40 rounded w-12" />
    </div>
  </div>
);

const ProfileHeaderSkeleton = () => (
  <div className="w-full relative min-h-screen bg-[#080016] text-white">
    <Header title="Profile" />
    <div className="p-6 border-b border-unseen-800/30 animate-pulse">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-unseen-900/60" />
          <div className="flex-1 flex justify-end space-x-6">
            <div className="h-8 bg-unseen-800/50 rounded w-16" />
            <div className="h-8 bg-unseen-800/50 rounded w-16" />
          </div>
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-6 bg-unseen-800/50 rounded w-1/3" />
          <div className="h-4 bg-unseen-800/30 rounded w-1/4" />
          <div className="h-4 bg-unseen-800/30 rounded w-2/3 mt-2" />
        </div>
      </div>
    </div>
    <div className="p-4 space-y-2">
      <PostSkeleton />
      <PostSkeleton />
    </div>
  </div>
);

function ProfileContent() {
  const router = useRouter();
  const { currentUser, logout, updateCurrentUser, isLoading: authLoading } = useAppContext();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');
  
  const isOwnProfile = !targetId || targetId === currentUser?.id;
  const profileIdToFetch = (isOwnProfile ? currentUser?.id : targetId) || '';
  
  // Store-backed cached state selectors.
  // useShallow compares array elements (not references) to prevent infinite loops.
  const profileUser = useAppStore(state => state.profiles[profileIdToFetch]);
  
  const profilePosts = useAppStore(useShallow(state => {
    const ids = state.feeds[`profile_${profileIdToFetch}`] || [];
    return ids.map(id => state.posts[id]).filter(Boolean);
  }));
  
  const savedPosts = useAppStore(useShallow(state => {
    const ids = state.feeds[`saved_${profileIdToFetch}`] || [];
    return ids.map(id => state.posts[id]).filter(Boolean);
  }));

  const [loadingProfile, setLoadingProfile] = useState(!profileUser);
  const [loadingPosts, setLoadingPosts] = useState(profilePosts.length === 0);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [showNetworkModal, setShowNetworkModal] = useState<'followers' | 'following' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [loadingNetwork, setLoadingNetwork] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Load cached profile data on mount to bypass loading spinner
  useEffect(() => {
    if (isOwnProfile && typeof window !== 'undefined') {
      const cachedProfile = localStorage.getItem('cached_own_profile');
      const cachedPosts = localStorage.getItem('cached_own_posts');
      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          useAppStore.getState().setProfile(profileIdToFetch, profile);
          setEditForm({
            displayName: profile.displayName || '',
            bio: profile.bio || ''
          });
          if (cachedPosts) {
            const postsParsed = JSON.parse(cachedPosts);
            useAppStore.getState().setFeed(`profile_${profileIdToFetch}`, postsParsed);
          }
          setLoadingProfile(false);
          setLoadingPosts(false);
        } catch (_) {}
      }
    }
  }, [isOwnProfile, profileIdToFetch]);

  useEffect(() => {
    if (profileIdToFetch) {
      fetchProfileData();
    } else if (isOwnProfile && currentUser === null && !authLoading) {
      router.push('/login');
    }
  }, [profileIdToFetch, authLoading, isOwnProfile, currentUser]);

  // Real-time follow counts and sync via sockets
  useEffect(() => {
    const socket = getSocket();
    const handleFollowUpdate = (data: { followerId: string, followingId: string, isFollowing: boolean, followersCount: number, followingCount: number }) => {
      if (profileUser && (profileUser._id || profileUser.id) === data.followingId) {
        useAppStore.getState().updateProfileLocal(data.followingId, {
          followersCount: data.followersCount,
          ...(currentUser && data.followerId === currentUser.id ? { isFollowing: data.isFollowing } : {})
        });
      }
      
      if (profileUser && (profileUser._id || profileUser.id) === data.followerId) {
        useAppStore.getState().updateProfileLocal(data.followerId, {
          followingCount: data.followingCount
        });
      }

      if (currentUser && data.followerId === currentUser.id) {
        updateCurrentUser({ followingCount: data.followingCount });
        const cached = localStorage.getItem('cached_own_profile');
        if (cached) {
          try {
            const p = JSON.parse(cached);
            p.followingCount = data.followingCount;
            localStorage.setItem('cached_own_profile', JSON.stringify(p));
          } catch (_) {}
        }
      }
      
      if (currentUser && data.followingId === currentUser.id) {
        updateCurrentUser({ followersCount: data.followersCount });
        const cached = localStorage.getItem('cached_own_profile');
        if (cached) {
          try {
            const p = JSON.parse(cached);
            p.followersCount = data.followersCount;
            localStorage.setItem('cached_own_profile', JSON.stringify(p));
          } catch (_) {}
        }
      }
    };

    socket.on('follow:update', handleFollowUpdate);
    return () => {
      socket.off('follow:update', handleFollowUpdate);
    };
  }, [profileUser, currentUser, updateCurrentUser]);

  // Silent background poll fallback (increased to 15 seconds)
  useEffect(() => {
    if (!profileIdToFetch) return;
    const interval = setInterval(async () => {
      try {
        const uData = await users.getProfile(profileIdToFetch);
        useAppStore.getState().updateProfileLocal(profileIdToFetch, {
          followersCount: uData.followersCount,
          followingCount: uData.followingCount,
        });
      } catch (_) {}
    }, 15000);
    return () => clearInterval(interval);
  }, [profileIdToFetch]);

  useEffect(() => {
    if (showNetworkModal && profileUser) {
      const fetchNetwork = async () => {
        setLoadingNetwork(true);
        try {
          if (showNetworkModal === 'followers') {
            const data = await users.getFollowers(profileUser._id || profileUser.id);
            setNetworkUsers(data);
          } else if (showNetworkModal === 'following') {
            const data = await users.getFollowing(profileUser._id || profileUser.id);
            setNetworkUsers(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingNetwork(false);
        }
      };
      fetchNetwork();
    } else {
      setNetworkUsers([]);
    }
  }, [showNetworkModal, profileUser]);

  const fetchProfileData = async () => {
    const hasProfile = !!useAppStore.getState().profiles[profileIdToFetch];
    const postsFeedKey = `profile_${profileIdToFetch}`;
    const hasPosts = (useAppStore.getState().feeds[postsFeedKey] || []).length > 0;

    if (!hasProfile) {
      setLoadingProfile(true);
    }
    if (!hasPosts) {
      setLoadingPosts(true);
    }
    try {
      const uData = await users.getProfile(profileIdToFetch);
      useAppStore.getState().setProfile(profileIdToFetch, uData);
      setEditForm({ displayName: uData.displayName || '', bio: uData.bio || '' });
      if (isOwnProfile && typeof window !== 'undefined') {
        localStorage.setItem('cached_own_profile', JSON.stringify(uData));
      }
      setLoadingProfile(false);
      
      const pData = await users.getPosts(profileIdToFetch);
      useAppStore.getState().setFeed(postsFeedKey, pData.posts);
      if (isOwnProfile && typeof window !== 'undefined') {
        localStorage.setItem('cached_own_posts', JSON.stringify(pData.posts));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved' && isOwnProfile && profileIdToFetch) {
      const hasSaved = (useAppStore.getState().feeds[`saved_${profileIdToFetch}`] || []).length > 0;
      if (!hasSaved) {
        setLoadingSaved(true);
      }
      const fetchSaved = async () => {
        try {
          const sData = await users.getSavedPosts(profileIdToFetch);
          useAppStore.getState().setFeed(`saved_${profileIdToFetch}`, sData.posts);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSaved(false);
        }
      };
      fetchSaved();
    }
  }, [activeTab, isOwnProfile, profileIdToFetch]);

  const handleToggleFollow = async () => {
    if (!profileUser || followLoading) return;
    setFollowLoading(true);
    try {
      await useAppStore.getState().toggleFollowUser(profileUser._id || profileUser.id, currentUser?.id);
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await users.updateProfile(editForm);
      useAppStore.getState().updateProfileLocal(profileIdToFetch, updated);
      setShowEditModal(false);
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setSavingProfile(false);
    }
  };

  if (authLoading) {
    return <ProfileHeaderSkeleton />;
  }

  if (loadingProfile && !profileUser) {
    return <ProfileHeaderSkeleton />;
  }

  if (!profileUser) {
    return <div className="p-8 text-center text-white">User not found.</div>;
  }

  return (
    <div className="w-full relative min-h-screen">
      <Header title={profileUser.displayName} />

      <div className="p-6 border-b border-unseen-800/30">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${profileUser.avatarColor || 'from-unseen-500 to-unseen-800'} shadow-[0_0_20px_rgba(157,78,221,0.3)] border-4 border-[#080016]`} />
              {profileUser.role === 'admin' && (
                <div className="absolute -bottom-1 -right-1 bg-red-600 p-1.5 rounded-full border-2 border-[#080016]">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3 flex-1">
              <div className="flex space-x-6">
                <button
                  onClick={() => isOwnProfile && setShowNetworkModal('followers')}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-white font-bold font-mono text-xl">{profileUser.followersCount}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Followers</span>
                </button>
                <button
                  onClick={() => isOwnProfile && setShowNetworkModal('following')}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <span className="text-white font-bold font-mono text-xl">{profileUser.followingCount}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Following</span>
                </button>
              </div>

              {/* Action buttons directly below them */}
              <div className="flex gap-2 w-full justify-end max-w-[200px]">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex-1 py-1.5 rounded-lg bg-unseen-900 border border-unseen-700 text-white font-semibold hover:bg-unseen-800 transition-colors text-center text-xs shadow-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <div className="relative">
                      {profileUser.isFollowing ? (
                        <button
                          onClick={handleToggleFollow}
                          className="w-full py-1.5 px-4 rounded-lg font-bold transition-all text-xs shadow-md bg-unseen-900 text-white border border-unseen-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                        >
                          Following
                        </button>
                      ) : (
                        <button
                          onClick={handleToggleFollow}
                          className="w-full py-1.5 px-4 rounded-lg font-bold transition-all text-xs shadow-md bg-white text-black hover:bg-gray-200"
                        >
                          Follow
                        </button>
                      )}
                    </div>
                    {profileUser.isFollowing && (
                      <button
                        onClick={() => router.push(`/messages?start=${profileUser._id}`)}
                        className="p-1.5 rounded-lg border border-unseen-700 bg-unseen-900 text-unseen-300 hover:bg-unseen-800 transition-colors shadow-md flex items-center justify-center"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold font-poppins text-white">{profileUser.displayName}</h1>
          <p className="text-sm text-unseen-300 font-mono mt-1">@{profileUser.username}</p>
        </div>

        <p className="text-gray-300 mt-4 max-w-lg leading-relaxed text-sm font-inter">
          {profileUser.bio || 'This user prefers to stay completely unseen in the shadows.'}
        </p>


      </div>

      <div className="flex w-full border-b border-unseen-800/30 sticky top-[73px] z-20 bg-[#080016] backdrop-blur-md">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors relative ${activeTab === 'posts' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts</span>
          {activeTab === 'posts' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-unseen-400 shadow-[0_0_10px_rgba(157,78,221,0.8)]" />}
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors relative ${activeTab === 'saved' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved</span>
            {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-unseen-400 shadow-[0_0_10px_rgba(157,78,221,0.8)]" />}
          </button>
        )}
      </div>

      <div className="pb-24">
        {activeTab === 'posts' && (
          loadingPosts ? (
            <div className="space-y-1">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : profilePosts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[250px]">
              <div className="w-14 h-14 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30 shadow-[0_0_12px_rgba(157,78,221,0.1)]">
                <Shield className="w-6 h-6 text-unseen-400 opacity-55" />
              </div>
              <p className="text-sm font-semibold text-gray-200">No posts made yet</p>
              <p className="text-xs mt-1.5 max-w-xs text-gray-500 leading-relaxed">
                This profile is completely silent. No posts have been made yet.
              </p>
            </div>
          ) : (
            profilePosts.map(post => <PostCard key={post._id} post={post} />)
          )
        )}
        
        {activeTab === 'saved' && (
          loadingSaved ? (
            <div className="space-y-1">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[250px]">
              <Bookmark className="w-8 h-8 mb-4 opacity-50 text-unseen-400" />
              <p>No saved posts yet.</p>
            </div>
          ) : (
            savedPosts.map(post => <PostCard key={post._id} post={post} />)
          )
        )}
      </div>

      <AnimatePresence>
        {showNetworkModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNetworkModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0A0014] border border-unseen-800/50 rounded-3xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(36,0,70,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unseen-600 via-unseen-400 to-unseen-600" />
              
              <div className="flex justify-between items-center mb-6 border-b border-unseen-800/30 pb-3">
                <div className="flex space-x-6">
                  <button 
                    onClick={() => setShowNetworkModal('followers')}
                    className={`text-lg font-bold font-poppins transition-colors relative pb-1 ${
                      showNetworkModal === 'followers' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Followers
                    {showNetworkModal === 'followers' && (
                      <motion.div 
                        layoutId="activeNetworkTabLine"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-unseen-500 to-unseen-400 shadow-[0_0_8px_rgba(157,78,221,0.8)]" 
                      />
                    )}
                  </button>
                  <button 
                    onClick={() => setShowNetworkModal('following')}
                    className={`text-lg font-bold font-poppins transition-colors relative pb-1 ${
                      showNetworkModal === 'following' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    Following
                    {showNetworkModal === 'following' && (
                      <motion.div 
                        layoutId="activeNetworkTabLine"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-unseen-500 to-unseen-400 shadow-[0_0_8px_rgba(157,78,221,0.8)]" 
                      />
                    )}
                  </button>
                </div>
                <button 
                  onClick={() => setShowNetworkModal(null)}
                  className="p-1 text-gray-500 hover:text-white transition-colors bg-unseen-900/50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-[300px] mt-2 relative">
                {loadingNetwork ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
                  </div>
                ) : networkUsers.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-unseen-900/40 flex items-center justify-center border border-unseen-800/30 shadow-[0_0_15px_rgba(157,78,221,0.2)]">
                      <UserPlus className="w-8 h-8 text-unseen-400 opacity-80" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-200">No {showNetworkModal} yet</h4>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {networkUsers.map(u => (
                    <div 
                      key={u._id} 
                      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-unseen-900/50 transition-colors border border-transparent hover:border-unseen-800/50"
                    >
                      <div className="relative w-12 h-12 rounded-full border-2 border-[#080016] shrink-0 overflow-hidden shadow-[0_0_10px_rgba(157,78,221,0.3)] cursor-pointer" onClick={() => { setShowNetworkModal(null); router.push(`/profile?id=${u._id}`); }}>
                         <div className={`absolute inset-0 bg-gradient-to-br ${u.avatarColor || 'from-gray-500 to-gray-700'}`} />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setShowNetworkModal(null); router.push(`/profile?id=${u._id}`); }}>
                        <h4 className="text-white font-semibold truncate text-sm">{u.displayName}</h4>
                        <p className="text-gray-400 text-xs font-mono truncate">@{u.username}</p>
                      </div>
                      <div className="relative">
                        {u.isFollowing ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await users.toggleFollow(u._id);
                                setNetworkUsers(prev => prev.map(user => user._id === u._id ? { ...user, isFollowing: res.isFollowing } : user));
                                if (profileUser && isOwnProfile) {
                                  useAppStore.getState().updateProfileLocal(profileIdToFetch, {
                                    followingCount: Math.max(0, (profileUser.followingCount || 0) + (res.isFollowing ? 1 : -1))
                                  });
                                }
                              } catch (err) {}
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md bg-unseen-900 text-white border border-unseen-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                          >
                            Following
                          </button>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const res = await users.toggleFollow(u._id);
                                setNetworkUsers(prev => prev.map(user => user._id === u._id ? { ...user, isFollowing: res.isFollowing } : user));
                                if (profileUser && isOwnProfile) {
                                  useAppStore.getState().updateProfileLocal(profileIdToFetch, {
                                    followingCount: Math.max(0, (profileUser.followingCount || 0) + (res.isFollowing ? 1 : -1))
                                  });
                                }
                              } catch (err) {}
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md bg-white text-black hover:bg-gray-200"
                          >
                            Follow
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0A0014] border border-unseen-800/50 rounded-3xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(36,0,70,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unseen-600 via-unseen-400 to-unseen-600" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-poppins text-white">Edit Profile</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-gray-500 hover:text-white transition-colors bg-unseen-900/50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="w-full bg-unseen-900/50 border border-unseen-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-unseen-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    maxLength={160}
                    className="w-full bg-unseen-900/50 border border-unseen-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-unseen-500 transition-colors min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="bg-unseen-600 hover:bg-unseen-500 text-white font-semibold py-2 px-6 rounded-full transition-colors flex items-center space-x-2"
                >
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-unseen-400" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
