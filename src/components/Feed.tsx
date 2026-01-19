'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ChevronDown, ChevronUp, Lock, Copy, Send, X } from 'lucide-react';
import { useState } from 'react';
import { Post, Profile } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';
import { CommentsPanel } from './CommentsPanel';

interface PostCardProps {
  post: Post;
  onProfileClick: (profileId: string) => void;
  onShare?: (post: Post) => void;
}

function Avatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[2px] flex-shrink-0`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40 blur-[2px]`} />
      </div>
    </div>
  );
}

function ShareModal({ post, isOpen, onClose }: { post: Post; isOpen: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`unseen.app/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[#0a0f1c]/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-[#0c1526] rounded-t-3xl md:rounded-3xl border border-[#1e3a6e]/30 overflow-hidden mx-4 mb-0 md:mb-4"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1e3a6e]/20">
          <h3 className="font-medium text-[#e0eaff]">Share Quietly</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#1e3a6e]/30 rounded-full">
            <X className="w-5 h-5 text-[#7a9fd4]" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#142240]/50 hover:bg-[#1a2d50]/60 transition-colors border border-[#1e3a6e]/20"
          >
            <div className="w-10 h-10 rounded-full bg-[#2a4d8f]/30 flex items-center justify-center">
              <Copy className="w-5 h-5 text-[#7aa2e3]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-[#e0eaff]">{copied ? 'Link copied!' : 'Copy link'}</p>
              <p className="text-xs text-[#5a7ab0]">Share privately with anyone</p>
            </div>
          </button>
          <button className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#142240]/50 hover:bg-[#1a2d50]/60 transition-colors border border-[#1e3a6e]/20">
            <div className="w-10 h-10 rounded-full bg-[#2a4d8f]/30 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#7aa2e3]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-sm text-[#e0eaff]">Send in chat</p>
              <p className="text-xs text-[#5a7ab0]">Share inside UNSEEN</p>
            </div>
          </button>
        </div>
        <div className="p-4 border-t border-[#1e3a6e]/20">
          <p className="text-xs text-[#5a7ab0] text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Identity stays hidden when you share
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PostCard({ post, onProfileClick, onShare }: PostCardProps) {
  const { getProfile, likePost, unlikePost, savePost, unsavePost } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const profile = getProfile(post.profileId);
  const isLiked = post.isLiked ?? false;
  const isSaved = post.isSaved ?? false;
  const likes = post.likes;

  const handleLike = () => {
    if (isLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
    }
  };

  const handleSave = () => {
    if (isSaved) {
      unsavePost(post.id);
    } else {
      savePost(post.id);
    }
  };

  const shouldTruncate = post.content.length > 280;
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.slice(0, 280) + '...' 
    : post.content;

  if (!profile) return null;
  if (post.type === 'voice') return null;

  return (
    <>
      <motion.article
        className="glass rounded-2xl p-6 mb-4 hover:bg-[#0f1e3d]/60 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-start justify-between mb-5">
          <button 
            className="flex items-center gap-3 group"
            onClick={() => onProfileClick(post.profileId)}
          >
            <Avatar profile={profile} />
            <div className="text-left">
              <p className="text-[#e0eaff] font-medium text-sm group-hover:text-[#7aa2e3] transition-colors">
                {profile.displayName}
              </p>
              <p className="text-[#5a7ab0] text-xs">@{profile.username} · {post.timestamp}</p>
            </div>
          </button>
          <button className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors opacity-50 hover:opacity-100">
            <MoreHorizontal className="w-4 h-4 text-[#5a7ab0]" />
          </button>
        </div>

        <div className="mb-5">
          <p className="post-content text-[15px]">{displayContent}</p>
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 mt-3 text-[#7aa2e3] text-sm hover:text-[#9ab8ed] transition-colors"
            >
              {isExpanded ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Read more <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-3 h-3 text-[#3b5998]" />
          <span className="text-xs text-[#3b5998]">Shared quietly</span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#1e3a6e]/15">
          <div className="flex items-center gap-8">
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 group"
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
              >
                <Heart className={`w-5 h-5 transition-colors ${
                  isLiked ? 'text-[#7aa2e3] fill-[#7aa2e3]' : 'text-[#5a7ab0] group-hover:text-[#7aa2e3]'
                }`} />
              </motion.div>
              <span className={`text-sm ${isLiked ? 'text-[#7aa2e3]' : 'text-[#5a7ab0]'}`}>
                {likes.toLocaleString()}
              </span>
            </button>
            <button 
              onClick={() => setShowComments(true)}
              className="flex items-center gap-2 group"
            >
              <MessageCircle className="w-5 h-5 text-[#5a7ab0] group-hover:text-[#7aa2e3] transition-colors" />
              <span className="text-sm text-[#5a7ab0]">{post.comments}</span>
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="group"
            >
              <Share2 className="w-5 h-5 text-[#5a7ab0] group-hover:text-[#7aa2e3] transition-colors" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className="group"
          >
            <Bookmark className={`w-5 h-5 transition-colors ${
              isSaved ? 'text-[#7aa2e3] fill-[#7aa2e3]' : 'text-[#5a7ab0] group-hover:text-[#7aa2e3]'
            }`} />
          </button>
        </div>
      </motion.article>

      <AnimatePresence>
        {showShareModal && (
          <ShareModal post={post} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
        )}
      </AnimatePresence>

      <CommentsPanel
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        post={post}
      />
    </>
  );
}

interface FeedProps {
  onProfileClick: (profileId: string) => void;
}

export function Feed({ onProfileClick }: FeedProps) {
  const { posts, userPosts } = useApp();
  const allPosts = [...userPosts, ...posts].filter(p => p.type === 'text');

  return (
    <div className="space-y-2">
      <div className="text-center py-4 mb-2">
        <p className="text-xs text-[#3b5998] flex items-center justify-center gap-2">
          <span className="w-8 h-[1px] bg-[#1e3a6e]/40" />
          Yaha shor nahi hai
          <span className="w-8 h-[1px] bg-[#1e3a6e]/40" />
        </p>
      </div>
      {allPosts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.5 }}
        >
          <PostCard post={post} onProfileClick={onProfileClick} />
        </motion.div>
      ))}
    </div>
  );
}
