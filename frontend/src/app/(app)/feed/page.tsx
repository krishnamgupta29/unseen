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
  const [activeTab, setActiveTab] = useState<FeedMode>('for_you');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [postContent, setPostContent] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`cached_feed_${activeTab}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          useAppStore.getState().setFeed(activeTab, parsed);
          setLoading(false);
        } catch (_) {}
      }
    }
    fetchPosts();
  }, [activeTab]);

  // Socket-driven realtime refresh (new post/deleted post events)
  useEffect(() => {
    const socket = getSocket();
    const handleNewPost = () => {
      if (activeTab === 'for_you' || activeTab === 'trending') {
        fetchPosts(true);
      }
    };
    const handleDeletedPost = (data: { postId: string }) => {
      useAppStore.getState().removePostLocal(data.postId);
    };

    socket.on('post:created', handleNewPost);
    socket.on('post:deleted', handleDeletedPost);
    return () => {
      socket.off('post:created', handleNewPost);
      socket.off('post:deleted', handleDeletedPost);
    };
  }, [activeTab]);

  // Silent background poll every 8 seconds — updates counts without spinner
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await feed.get(activeTab, 1);
        const freshPosts = data.posts || [];
        freshPosts.forEach((fp: any) => {
          useAppStore.getState().updatePostLocal(fp._id, {
            likesCount: fp.likesCount,
            commentsCount: fp.commentsCount,
            viewCount: fp.viewCount,
            shareCount: fp.shareCount,
          });
        });
      } catch (_) {}
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchPosts = async (silent = false) => {
    if (!silent && posts.length === 0) setLoading(true);
    try {
      const data = await feed.get(activeTab, 1);
      const fetched = data.posts || [];
      useAppStore.getState().setFeed(activeTab, fetched);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cached_feed_${activeTab}`, JSON.stringify(fetched));
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

  return (
    <div className="w-full min-h-screen">
      <Header title="The Void" />

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
            maxLength={500}
            placeholder="Whisper into the void..."
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
              <span className={`text-xs ${postContent.length > 450 ? 'text-orange-400' : 'text-gray-600'}`}>
                {postContent.length}/500
              </span>
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
              <p className="text-base font-semibold text-gray-200">The void is silent</p>
              <p className="text-xs mt-1.5 max-w-xs text-gray-500 leading-relaxed">
                No whispers have resonated here yet. Be the first to shatter the silence.
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
