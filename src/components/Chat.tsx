'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, MoreVertical, Image, Smile, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Conversation, Profile, Message } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';

interface ChatListProps {
  onSelectChat: (conversation: Conversation) => void;
}

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

function Avatar({ profile, size = 'md' }: { profile: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${profile.avatarGradient} p-[2px] flex-shrink-0`}>
      <div className="w-full h-full rounded-full bg-[#0d1526] flex items-center justify-center">
        <div className={`w-[70%] h-[70%] rounded-full bg-gradient-to-br ${profile.avatarGradient} opacity-40 blur-[1px]`} />
      </div>
    </div>
  );
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const { conversations, getProfile } = useApp();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      <div className="px-5 py-6 border-b border-[#1e3a6e]/15">
        <h1 className="text-xl font-semibold mb-1 text-[#e0eaff]">Messages</h1>
        <p className="text-[#5a7ab0] text-sm flex items-center gap-2">
          <Lock className="w-3 h-3" />
          Private conversations
        </p>
      </div>

      <div className="divide-y divide-[#1e3a6e]/10">
        {conversations.map((conversation, index) => {
          const profile = getProfile(conversation.profileId);
          if (!profile) return null;

          return (
            <motion.button
              key={conversation.id}
              onClick={() => onSelectChat(conversation)}
              className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#142240]/40 transition-colors text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative">
                <Avatar profile={profile} />
                {conversation.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4a7cc9] rounded-full flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{conversation.unread}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-medium text-sm truncate ${conversation.unread > 0 ? 'text-[#e0eaff]' : 'text-[#a0c4ff]'}`}>
                    {profile.displayName}
                  </p>
                  <span className={`text-xs ${conversation.unread > 0 ? 'text-[#7aa2e3]' : 'text-[#3b5998]'}`}>
                    {conversation.timestamp}
                  </span>
                </div>
                <p className={`text-sm truncate ${conversation.unread > 0 ? 'text-[#a0c4ff]' : 'text-[#5a7ab0]'}`}>
                  {conversation.lastMessage}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="p-5 mt-4">
        <p className="text-xs text-[#3b5998] text-center">
          Conversations are end-to-end private
        </p>
      </div>
    </motion.div>
  );
}

export function ChatView({ conversation, onBack }: ChatViewProps) {
  const { getProfile, addMessage } = useApp();
  const [message, setMessage] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>(
    conversation.messages.filter(m => m.type !== 'voice')
  );
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const profile = getProfile(conversation.profileId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: `new-${Date.now()}`,
      senderId: 'me',
      content: message,
      timestamp: 'Just now',
      isMe: true,
      type: 'text',
    };

    setLocalMessages([...localMessages, newMessage]);
    addMessage(conversation.id, message, 'text');
    setMessage('');

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Samajh sakta hoon.",
        "Bilkul feel kiya.",
        "Akele nahi ho.",
        "Sunke acha laga.",
        "Main bhi aise hi feel karta hoon kabhi kabhi.",
        "Dil ki baat kahi tumne.",
        "Sach mein... same here.",
        "Yeh toh dil touch kar gaya.",
      ];
      const reply: Message = {
        id: `reply-${Date.now()}`,
        senderId: conversation.profileId,
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: 'Just now',
        isMe: false,
        type: 'text',
      };
      setLocalMessages((prev) => [...prev, reply]);
    }, 2000 + Math.random() * 1000);
  };

  if (!profile) return null;

  return (
    <motion.div
      className="flex flex-col h-full bg-[#0a0f1c]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="glass-strong px-4 py-3 flex items-center gap-3 border-b border-[#1e3a6e]/15">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#e0eaff]" />
        </button>
        <Avatar profile={profile} size="sm" />
        <div className="flex-1">
          <p className="font-medium text-sm text-[#e0eaff]">{profile.displayName}</p>
          <p className="text-xs text-[#5a7ab0] flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            Anonymous · Private
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-[#5a7ab0]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        <div className="text-center py-4">
          <p className="text-xs text-[#3b5998]">
            This conversation is private and anonymous
          </p>
        </div>

        {localMessages.filter(m => m.type !== 'voice').map((msg, index) => (
          <motion.div
            key={msg.id}
            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.isMe
                  ? 'bg-gradient-to-r from-[#2a4d8f] to-[#3b5ca8] rounded-br-md'
                  : 'bg-[#142240]/70 rounded-bl-md border border-[#1e3a6e]/20'
              }`}
            >
              <p className="text-sm leading-relaxed text-[#e0eaff]">{msg.content}</p>
              <p className={`text-[10px] mt-2 ${msg.isMe ? 'text-[#a0c4ff]/70' : 'text-[#5a7ab0]'}`}>
                {msg.timestamp}
              </p>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="flex justify-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-[#142240]/70 px-4 py-3 rounded-2xl rounded-bl-md border border-[#1e3a6e]/20">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#5a7ab0]"
                      animate={{ y: [-2, 2, -2] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#1e3a6e]/15">
        <div className="flex items-center gap-3 bg-[#142240]/50 rounded-full px-4 py-2 border border-[#1e3a6e]/20">
          <button className="p-1.5 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <Image className="w-5 h-5 text-[#5a7ab0]" />
          </button>
          <input
            type="text"
            placeholder="Type quietly..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-sm text-[#e0eaff] placeholder:text-[#5a7ab0] focus:outline-none"
          />
          <button className="p-1.5 hover:bg-[#1e3a6e]/30 rounded-full transition-colors">
            <Smile className="w-5 h-5 text-[#5a7ab0]" />
          </button>
          {message.trim() && (
            <motion.button
              onClick={handleSend}
              className="p-2 bg-[#4a7cc9] rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
