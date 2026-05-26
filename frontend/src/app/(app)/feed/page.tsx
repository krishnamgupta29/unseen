'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import PostCard from '@/components/PostCard';
import { feed, FeedMode } from '@/lib/api';
import { useAppStore } from '@/lib/store';

const TABS: { id: FeedMode; label: string }[] = [
  { id: 'for_you', label: 'For You' },
  { id: 'following', label: 'Following' },
  { id: 'trending', label: 'Trending' },
  { id: 'late_night', label: 'Late Night' },
  { id: 'rising', label: 'Rising' },
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
  const [activeTab] = useState<FeedMode>('for_you');
  const [loading, setLoading] = useState(true);

  const [postContent, setPostContent] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Retrieve cached post IDs and objects from the Zustand store
  const postIds = useAppStore(state => state.feeds[activeTab] || []);
  const posts = useAppStore(state => postIds.map(id => state.posts[id]).filter(Boolean));

  // Load cached posts on mount
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

  // Silent background poll every 5 seconds — updates counts without spinner in the global cache
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await feed.get(activeTab, 1);
        const freshPosts = data.posts || [];
        // Merge fresh counts into existing posts in the Zustand store
        freshPosts.forEach((fp: any) => {
          useAppStore.getState().updatePostLocal(fp._id, {
            likesCount: fp.likesCount,
            commentsCount: fp.commentsCount,
            viewCount: fp.viewCount,
            shareCount: fp.shareCount,
          });
        });
      } catch (_) {
        // Silent — don't show errors for background polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchPosts = async () => {
    if (posts.length === 0) {
      setLoading(true);
    }
    try {
      const data = await feed.get(activeTab, 1);
      const fetched = data.posts || [];
      useAppStore.getState().setFeed(activeTab, fetched);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cached_feed_${activeTab}`, JSON.stringify(fetched));
      }
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error('Failed to fetch posts', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newPost = await feed.createPost(postContent, moodTag);
      // Prepend to current feed in store
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

      {/* Tabs have been removed as requested */}

      {/* Compose */}
      <div className="p-4 border-b border-unseen-800/30">
        <div className="glass p-3 md:p-4 rounded-2xl">
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            maxLength={500}
            placeholder="Whisper into the void..."
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[50px] md:min-h-[80px]"
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
                className="bg-unseen-600 hover:bg-unseen-500 disabled:opacity-50 disabled:hover:bg-unseen-600 text-white font-semibold py-2 px-6 rounded-full transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="pb-24">
        {loading && posts.length === 0 ? (
          <div className="space-y-1">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30 shadow-[0_0_15px_rgba(157,78,221,0.15)]">
              <Sparkles className="w-7 h-7 text-unseen-400 opacity-60 animate-pulse" />
            </div>
            <p className="text-base font-semibold text-gray-200">The void is silent</p>
            <p className="text-xs mt-1.5 max-w-xs text-gray-500 leading-relaxed">
              No whispers have resonated in this dimension yet. Be the first to shatter the silence and post your shadow thoughts!
            </p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
