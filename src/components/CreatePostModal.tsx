'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, EyeOff, Shield, Zap, Send } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

interface CreatePostModalProps {
  isOpen: boolean;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { addPost, currentUser } = useApp();
  const [content, setContent] = useState('');

  const handlePost = () => {
    if (content.trim()) {
      addPost({
        profileId: currentUser.id,
        type: 'text',
        content: content.trim(),
      });
      setContent('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center pt-20 pb-4 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            onClick={onClose} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          <motion.div
            className="relative w-full max-w-lg bg-black/80 rounded-t-[32px] md:rounded-3xl border border-white/10 overflow-hidden mx-auto drop-shadow-[0_0_30px_rgba(106,0,255,0.15)] shadow-2xl flex flex-col max-h-[90vh]"
            initial={{ y: '100%', scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
              <h2 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-widest uppercase text-sm">Initiate Drop</h2>
              <div className="w-9 h-9" /> {/* Spacer for centering */}
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {/* Text Area */}
              <div className="relative group">
                <textarea
                  placeholder="Transmit your signal..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-56 bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00f0ff]/50 focus:bg-white/10 resize-none text-[16px] leading-relaxed transition-all custom-scrollbar"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Lock className="w-3 h-3 text-[#00f0ff]" />
                <span className="uppercase tracking-wider">End-to-end encrypted</span>
              </div>
              
              <motion.button 
                onClick={handlePost}
                disabled={!content.trim()}
                className={`relative overflow-hidden px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition-all flex items-center gap-2 group ${
                  !content.trim()
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'text-white'
                }`}
                whileTap={content.trim() ? { scale: 0.95 } : {}}
              >
                {content.trim() && (
                  <motion.div 
                    layoutId="sendBtnAction"
                    className="absolute inset-0 bg-gradient-to-r from-[#6a00ff] to-[#ff00ea]"
                  />
                )}
                <span className="relative z-10">Drop</span>
                {content.trim() && (
                  <Send className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
