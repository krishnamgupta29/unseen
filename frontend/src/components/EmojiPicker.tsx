'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: '🕵️ Secrets',
    emojis: [
      '🤫', '👁️‍🗨️', '🎭', '🔮', '🕵️', '👽', '💀', '🧬',
      '🩸', '🕸️', '🌒', '🦇', '🐍', '🫥', '🥷',
    ],
  },
  {
    label: '😈 Faces',
    emojis: [
      '😂', '🤣', '😮', '🥺', '😢', '🤡', '👻', '😈',
      '🫠', '🤯', '😶‍🌫️', '🥶', '🫣', '😏', '🤤',
    ],
  },
  {
    label: '🌌 Cosmic',
    emojis: [
      '🌑', '🌌', '🌟', '✨', '🔥', '💫', '☄️', '🪐',
      '🌀', '⚡', '🫧', '🌊',
    ],
  },
  {
    label: '💜 Symbols',
    emojis: [
      '💜', '❤️', '🖤', '💯', '💢', '♾️', '🩷', '❤️‍🔥',
      '💝', '🫀', '🧿', '⛓️',
    ],
  },
  {
    label: '👀 Vibes',
    emojis: [
      '👀', '🙌', '👍', '👎', '🤝', '🫶', '🎉', '🎶',
      '💅', '🤙', '✌️', '🫡',
    ],
  },
];

export default function EmojiPicker({ onSelectEmoji, align = 'left', className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-unseen-400 hover:bg-unseen-800/30 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
        title="Insert Emoji"
      >
        <Smile className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-3 z-50 bg-[#0a0216]/50 backdrop-blur-xl border border-unseen-850/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(147,51,234,0.1)] p-3 w-72 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Category Tabs */}
            <div className="flex gap-1 mb-2.5 overflow-x-auto scrollbar-hide pb-1">
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setActiveCategory(idx)}
                  className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeCategory === idx
                      ? 'bg-unseen-700/50 text-white shadow-[0_0_8px_rgba(147,51,234,0.25)] border border-unseen-600/30'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-unseen-900/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="max-h-40 overflow-y-auto scrollbar-hide">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="grid grid-cols-6 gap-1.5"
              >
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-9 h-9 flex items-center justify-center text-lg hover:bg-unseen-700/40 rounded-xl transition-all hover:scale-110 active:scale-90 cursor-pointer hover:shadow-[0_0_8px_rgba(147,51,234,0.2)]"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="mt-2 pt-2 border-t border-unseen-800/20">
              <p className="text-[9px] uppercase tracking-widest font-mono text-gray-600 text-center">
                Whisper Emojis • {EMOJI_CATEGORIES[activeCategory].emojis.length} available
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
