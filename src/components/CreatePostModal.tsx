'use client';

import { motion } from 'framer-motion';
import { X, Type, Lock } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { addPost } = useApp();
  const [content, setContent] = useState('');

  const handlePost = () => {
    if (content.trim()) {
      addPost({
        profileId: 'me',
        type: 'text',
        content: content.trim(),
      });
      setContent('');
      onClose();
    }
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
        className="relative w-full max-w-lg bg-[#0c1526] rounded-t-3xl md:rounded-3xl border border-[#1e3a6e]/20 overflow-hidden mx-4 mb-0 md:mb-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1e3a6e]/15">
          <button onClick={onClose} className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#7a9fd4]" />
          </button>
          <h2 className="font-semibold text-[#e0eaff]">Share your thoughts</h2>
          <button 
            onClick={handlePost}
            disabled={!content.trim()}
            className="px-4 py-1.5 bg-[#4a7cc9] hover:bg-[#5a8cd9] disabled:bg-[#142240] disabled:text-[#5a7ab0] rounded-full text-sm font-medium transition-colors text-white"
          >
            Share
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 p-3 bg-[#142240]/40 rounded-xl mb-5 border border-[#1e3a6e]/15">
            <Type className="w-4 h-4 text-[#7aa2e3]" />
            <span className="text-sm text-[#7aa2e3]">Text Post</span>
          </div>

          <div className="space-y-4">
            <textarea
              placeholder="Kya chal raha hai mann mein? Yaha share karo, anonymously..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-[#142240]/40 border border-[#1e3a6e]/15 rounded-2xl p-4 text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none focus:border-[#4a7cc9]/40 resize-none text-[15px] leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#5a7ab0]">
                <Lock className="w-3 h-3" />
                <span className="text-xs">Anonymous post</span>
              </div>
              <span className={`text-xs ${content.length > 450 ? 'text-amber-400' : 'text-[#5a7ab0]'}`}>
                {content.length}/500
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#1e3a6e]/15 bg-[#142240]/20">
          <div className="flex items-center gap-3 text-sm text-[#5a7ab0]">
            <span className="w-2 h-2 rounded-full bg-[#4a7cc9]" />
            <span>Posting anonymously as your hidden self</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
