'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import PostCard from '@/components/PostCard';
import { feed, FeedMode } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { getSocket } from '@/lib/socketClient';
import { useAppContext } from '@/context/AppContext';

const TABS: { id: FeedMode; label: string; emoji: string }[] = [
  { id: 'for_you',    label: 'For You',    emoji: '✦'  },
  { id: 'following',  label: 'Following',  emoji: '👁'  },
  { id: 'trending',   label: 'Trending',   emoji: '🔥' },
  { id: 'late_night', label: 'Late Night', emoji: '🌙' },
  { id: 'rising',     label: 'Rising',     emoji: '⚡' },
];

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
      <div className="h-3 bg-unseen-800/30 rounded w-2/3" />
    </div>
    <div className="flex space-x-12">
      <div className="h-4 bg-unseen-800/40 rounded w-12" />
      <div className="h-4 bg-unseen-800/40 rounded w-12" />
      <div className="h-4 bg-unseen-800/40 rounded w-12" />
    </div>
  </div>
);

export default function FeedPage() {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<FeedMode>('for_you');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Retrieve posts from the Zustand store.
  // useShallow compares array elements (not reference) to prevent the
  // "getSnapshot should be cached" infinite loop crash.
  const posts = useAppStore(useShallow(state => {
    const ids = state.feeds[activeTab] || [];
    return ids.map(id => state.posts[id]).filter(Boolean);
  }));

  // Load cached posts on mount / tab change
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.id) {
      const cached = localStorage.getItem(`cached_feed_${activeTab}:${currentUser.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          useAppStore.getState().setFeed(activeTab, parsed);
          setLoading(false);
        } catch (_) {}
      } else {
        setLoading(true);
      }
    }
    fetchPosts();
  }, [activeTab, currentUser?.id]);

  // Clear pending posts when switching tabs
  useEffect(() => {
    setPendingPosts([]);
  }, [activeTab]);

  // Monitor socket connection state
  useEffect(() => {
    const socket = getSocket();
    setIsSocketConnected(socket.connected);

    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  // Sync delta updates: fetches posts newer than the first loaded post
  const syncNewerPosts = useCallback(async () => {
    if (posts.length === 0 || !currentUser?.id) return;
    const newestPost = posts[0];
    if (!newestPost || !newestPost.createdAt) return;

    try {
      const data = await feed.get(activeTab, 1, newestPost.createdAt);
      const fetched = data.posts || [];
      if (fetched.length === 0) return;

      const store = useAppStore.getState();
      const nonDuplicates = fetched.filter((p: any) => {
        // Prevent duplication & filter by current user
        if (store.posts[p._id]) return false;
        if (p.author?.id === currentUser.id || p.author?._id === currentUser.id) return false;
        
        // Filter following tab: only show posts from followed authors
        if (activeTab === 'following') {
          return p.author?.isFollowing === true;
        }
        return true;
      });

      if (nonDuplicates.length === 0) return;

      if (window.scrollY < 100) {
        // Prepend immediately if near the top
        nonDuplicates.forEach((p: any) => {
          store.prependToFeed(activeTab, p);
        });
      } else {
        // Buffer posts in queue if user is reading below
        setPendingPosts((prev) => {
          const combined = [...prev];
          nonDuplicates.forEach((p: any) => {
            if (!combined.some(cp => cp._id === p._id)) {
              combined.push(p);
            }
          });
          return combined;
        });
      }
    } catch (e) {
      console.error('Failed to sync newer posts:', e);
    }
  }, [posts, activeTab, currentUser?.id]);

  // Monitor page visibility state and sync on resume
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (visible) {
        syncNewerPosts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncNewerPosts]);

  // Fallback Polling: poll for new posts every 45s ONLY when disconnected and visible
  useEffect(() => {
    if (isSocketConnected || !isVisible) return;

    const interval = setInterval(() => {
      syncNewerPosts();
    }, 45000);

    return () => clearInterval(interval);
  }, [isSocketConnected, isVisible, syncNewerPosts]);

  // WebSocket Live Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const handleNewPost = (post: any) => {
      if (!currentUser?.id) return;
      const store = useAppStore.getState();
      if (store.posts[post._id]) return;
      if (post.author?.id === currentUser.id || post.author?._id === currentUser.id) return;

      // Filter following tab: only show posts from followed authors
      if (activeTab === 'following' && !post.author?.isFollowing) {
        return;
      }

      if (window.scrollY < 100) {
        store.prependToFeed(activeTab, post);
      } else {
        setPendingPosts((prev) => {
          if (prev.some(p => p._id === post._id)) return prev;
          return [...prev, post];
        });
      }
    };

    const handleDeletedPost = (data: { postId: string }) => {
      useAppStore.getState().removePostLocal(data.postId);
      setPendingPosts((prev) => prev.filter(p => p._id !== data.postId));
    };

    const handlePostLiked = (data: { postId: string; likesCount: number; savesCount: number; userId: string }) => {
      if (data.userId === currentUser?.id) return; // Protect optimistic UI
      useAppStore.getState().updatePostLocal(data.postId, { likesCount: data.likesCount });
    };

    const handlePostUnliked = (data: { postId: string; likesCount: number; savesCount: number; userId: string }) => {
      if (data.userId === currentUser?.id) return; // Protect optimistic UI
      useAppStore.getState().updatePostLocal(data.postId, { likesCount: data.likesCount });
    };

    const handlePostSaved = (data: { postId: string; likesCount: number; savesCount: number; userId: string }) => {
      if (data.userId === currentUser?.id) return; // Protect optimistic UI
      useAppStore.getState().updatePostLocal(data.postId, { savesCount: data.savesCount });
    };

    const handlePostUnsaved = (data: { postId: string; likesCount: number; savesCount: number; userId: string }) => {
      if (data.userId === currentUser?.id) return; // Protect optimistic UI
      useAppStore.getState().updatePostLocal(data.postId, { savesCount: data.savesCount });
    };

    const handleCommentCreated = (data: { postId: string; comment: any }) => {
      const store = useAppStore.getState();
      const post = store.posts[data.postId];
      if (post) {
        store.updatePostLocal(data.postId, { commentsCount: post.commentsCount + 1 });
      }
    };

    const handleCommentDeleted = (data: { postId: string; commentId: string; deletedCount: number }) => {
      const store = useAppStore.getState();
      const post = store.posts[data.postId];
      if (post) {
        store.updatePostLocal(data.postId, { commentsCount: Math.max(0, post.commentsCount - data.deletedCount) });
      }
    };

    const handleFollowCreated = (data: { followerId: string; followingId: string; followersCount: number; followingCount: number }) => {
      const store = useAppStore.getState();
      store.updateProfileLocal(data.followingId, { followersCount: data.followersCount });
      Object.keys(store.posts).forEach((postId) => {
        const p = store.posts[postId];
        if (p.author && (p.author.id === data.followingId || p.author._id === data.followingId)) {
          store.updatePostLocal(postId, { author: { ...p.author, followersCount: data.followersCount } });
        }
      });
      store.updateProfileLocal(data.followerId, { followingCount: data.followingCount });
    };

    const handleFollowRemoved = (data: { followerId: string; followingId: string; followersCount: number; followingCount: number }) => {
      const store = useAppStore.getState();
      store.updateProfileLocal(data.followingId, { followersCount: data.followersCount });
      Object.keys(store.posts).forEach((postId) => {
        const p = store.posts[postId];
        if (p.author && (p.author.id === data.followingId || p.author._id === data.followingId)) {
          store.updatePostLocal(postId, { author: { ...p.author, followersCount: data.followersCount } });
        }
      });
      store.updateProfileLocal(data.followerId, { followingCount: data.followingCount });
    };

    socket.on('post:created', handleNewPost);
    socket.on('post:deleted', handleDeletedPost);
    socket.on('post:liked', handlePostLiked);
    socket.on('post:unliked', handlePostUnliked);
    socket.on('post:saved', handlePostSaved);
    socket.on('post:unsaved', handlePostUnsaved);
    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('follow:created', handleFollowCreated);
    socket.on('follow:removed', handleFollowRemoved);

    return () => {
      socket.off('post:created', handleNewPost);
      socket.off('post:deleted', handleDeletedPost);
      socket.off('post:liked', handlePostLiked);
      socket.off('post:unliked', handlePostUnliked);
      socket.off('post:saved', handlePostSaved);
      socket.off('post:unsaved', handlePostUnsaved);
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('follow:created', handleFollowCreated);
      socket.off('follow:removed', handleFollowRemoved);
    };
  }, [activeTab, currentUser?.id]);

  const fetchPosts = async (silent = false) => {
    if (!silent && posts.length === 0) setLoading(true);
    try {
      const data = await feed.get(activeTab, 1);
      const fetched = data.posts || [];
      useAppStore.getState().setFeed(activeTab, fetched);
      if (typeof window !== 'undefined' && currentUser?.id) {
        localStorage.setItem(`cached_feed_${activeTab}:${currentUser.id}`, JSON.stringify(fetched));
      }
    } catch (e: any) {
      if (
        e?.message !== 'Token expired.' &&
        e?.message !== 'Authentication required.' &&
        e?.message !== 'Invalid token.' &&
        e?.message !== 'Unauthorized'
      ) {
        console.error('Failed to fetch posts', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchPosts(true);
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newPost = await feed.createPost(postContent, moodTag);
      useAppStore.getState().prependToFeed(activeTab, newPost);
      setPostContent('');
      setMoodTag('');
    } catch (e) {
      console.error('Failed to create post', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPendingPosts = () => {
    const store = useAppStore.getState();
    const sorted = [...pendingPosts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    sorted.forEach((post) => {
      store.prependToFeed(activeTab, post);
    });
    setPendingPosts([]);
  };

  return (
    <div className="w-full min-h-screen">
      <Header title="Feed" />

      {/* Feed Tabs */}
      <div ref={tabsRef} className="relative flex items-center overflow-x-auto border-b border-unseen-800/30 bg-[#080016]/80 backdrop-blur-sm sticky top-0 z-20 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-sm leading-none">{tab.emoji}</span>
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="feed-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-unseen-400 via-unseen-300 to-unseen-400 rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="ml-auto mr-3 p-2 text-gray-500 hover:text-unseen-300 transition-colors shrink-0"
          title="Refresh feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Compose */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-4">
        <div className="glass p-3 md:p-4 rounded-2xl">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[50px] md:min-h-[80px] text-sm font-inter leading-relaxed"
          />
          <div className="flex items-center justify-between mt-3 md:mt-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={moodTag}
                maxLength={20}
                onChange={(e) => setMoodTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                placeholder="#mood"
                className="bg-unseen-900/50 border border-unseen-700/50 rounded-full px-4 py-1.5 text-sm text-unseen-300 placeholder-gray-600 focus:outline-none focus:border-unseen-500 w-28 md:w-32"
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePostSubmit}
                disabled={!postContent.trim() || isSubmitting}
                className="bg-unseen-600 hover:bg-unseen-500 disabled:opacity-50 disabled:hover:bg-unseen-600 text-white font-semibold py-2 px-5 rounded-full transition-all duration-200 flex items-center space-x-2 active:scale-95 text-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Banner for new posts */}
      {pendingPosts.length > 0 && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-4">
          <button
            onClick={handleApplyPendingPosts}
            className="w-full bg-gradient-to-r from-unseen-800/90 to-purple-800/90 hover:from-unseen-700 hover:to-purple-700 text-unseen-200 text-xs font-semibold py-3 px-4 rounded-2xl border border-unseen-700/50 shadow-lg shadow-black/50 flex items-center justify-center space-x-2 transition-all duration-200 active:scale-[0.99] backdrop-blur-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New posts available ({pendingPosts.length}) · Tap to refresh</span>
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="pb-24 max-w-2xl mx-auto w-full px-4 pt-4">
        <AnimatePresence mode="wait">
          {loading && posts.length === 0 ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </motion.div>
          ) : posts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30 shadow-[0_0_15px_rgba(157,78,221,0.15)]">
                <Sparkles className="w-7 h-7 text-unseen-400 opacity-60 animate-pulse" />
              </div>
              <p className="text-base font-semibold text-gray-200">No posts yet</p>
              <p className="text-xs mt-1.5 max-w-xs text-gray-500 leading-relaxed">
                No posts yet. Be the first to share something.
              </p>
              <button
                onClick={() => fetchPosts()}
                className="mt-5 text-xs text-unseen-400 hover:text-unseen-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </motion.div>
          ) : (
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
