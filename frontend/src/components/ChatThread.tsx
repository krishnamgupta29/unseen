'use client';

import { ArrowLeft, Send, Loader2, Heart, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { messages as apiMessages, users as apiUsers } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { playMessageSound } from '@/lib/sound';
import { getSocket } from '@/lib/socketClient';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';

// Helper component for shared post rendering inside chat
interface SharedPostPreviewProps {
  postId: string;
  onClick: () => void;
}

import { feed as apiFeed } from '@/lib/api';
function SharedPostPreview({ postId, onClick }: SharedPostPreviewProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFeed.getPostById(postId)
      .then((data) => {
        if (active) {
          setPost(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });
      
    const socket = getSocket();
    const handlePostDeleted = (data: { postId: string }) => {
      if (data.postId === postId && active) {
        setPost(null);
      }
    };
    socket.on('post:deleted', handlePostDeleted);
      
    return () => {
      active = false;
      socket.off('post:deleted', handlePostDeleted);
    };
  }, [postId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-[#120722]/50 rounded-2xl p-4 border border-unseen-800/40 flex items-center space-x-3 w-64 shadow-lg">
        <div className="w-8 h-8 rounded-full bg-unseen-800/70" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-unseen-800/70 rounded w-1/3" />
          <div className="h-3.5 bg-unseen-800/70 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#120722]/50 rounded-2xl p-4 border border-unseen-800/40 text-xs text-gray-500 italic w-64 shadow-lg">
        Deleted Post
      </div>
    );
  }

  return (
    <div 
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="block bg-[#120722]/80 hover:bg-[#1b0a33]/90 transition-all rounded-2xl p-4 border border-unseen-700/30 hover:border-unseen-500/50 text-left cursor-pointer group/card w-64 shadow-xl"
    >
      <div className="flex items-center space-x-2.5 mb-2.5">
        <div className="relative flex-shrink-0">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${post.author.avatarColor || 'from-gray-500 to-gray-700'} blur-sm opacity-50`} />
          <div className={`relative w-7 h-7 rounded-full bg-gradient-to-br ${post.author.avatarColor || 'from-gray-500 to-gray-700'} border border-[#080016]`} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-gray-200 truncate leading-tight group-hover/card:text-white transition-colors">{post.author.displayName}</h4>
          <p className="text-[9px] text-gray-500 font-mono truncate">@{post.author.username}</p>
        </div>
      </div>
      <p className="text-xs text-gray-300 line-clamp-3 font-inter leading-relaxed mb-3 group-hover/card:text-gray-100 transition-colors">
        {post.content}
      </p>
      <div className="flex items-center space-x-3 text-[9px] text-gray-500 font-medium border-t border-unseen-800/30 pt-2">
        <span>❤️ {post.likesCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
      </div>
    </div>
  );
}

interface ChatThreadProps {
  participantId: string;
  onBack: () => void;
}

export default function ChatThread({ participantId, onBack }: ChatThreadProps) {
  const router = useRouter();
  const { currentUser } = useAppContext();
  
  const activeChat = useAppStore(state => state.profiles[participantId]);
  const messages = useAppStore(useShallow(state => state.messages[participantId] || []));
  
  const [loading, setLoading] = useState(!activeChat);
  const [msgText, setMsgText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [animatingDoubleTap, setAnimatingDoubleTap] = useState<Record<string, boolean>>({});
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // remote user is typing
  const [localTyping, setLocalTyping] = useState(false); // we are typing
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Click outside menu closer
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) setShowChatMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch / Sync profile details
  useEffect(() => {
    if (!participantId) return;
    
    // Silently fetch details and cache
    apiUsers.getProfile(participantId)
      .then((data) => {
        useAppStore.getState().setProfile(participantId, data);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Failed to load target profile", e);
        setLoading(false);
      });
  }, [participantId]);

  // Load and Listen to thread messages (Socket-first & Poll fallback)
  useEffect(() => {
    if (!participantId || !currentUser) return;
    
    // Load cached messages instantly, then fetch in the background
    loadMessages();
    const interval = setInterval(loadMessages, 15000); // 15s poll fallback
    
    const socket = getSocket();
    
    // Typing indicators
    const handleTypingStart = (data: { userId: string }) => {
      if (data.userId === participantId) setIsTyping(true);
    };
    const handleTypingStop = (data: { userId: string }) => {
      if (data.userId === participantId) setIsTyping(false);
    };
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    
    const handleNewMessage = (msg: any) => {
      if (msg.sender === participantId || msg.receiver === participantId) {
        useAppStore.getState().addMessageLocal(participantId, msg);
        if (msg.sender !== currentUser.id) {
          playMessageSound();
        }
        // Mark message as read
        if (msg.sender === participantId) {
          socket.emit('message:read', { senderId: participantId });
        }
      }
    };
    
    const handleReactionAdd = (data: { messageId: string; emoji: string; userId: string }) => {
      useAppStore.getState().updateMessageLocal(participantId, data.messageId, {
        reactions: [{ userId: data.userId, emoji: data.emoji }]
      });
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('reaction:add', handleReactionAdd);

    // Read receipt send on open
    socket.emit('message:read', { senderId: participantId });

    return () => {
      clearInterval(interval);
      socket.off('message:receive', handleNewMessage);
      socket.off('reaction:add', handleReactionAdd);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [participantId, currentUser]);

  const loadMessages = async () => {
    if (!participantId) return;
    try {
      const data = await apiMessages.getMessages(participantId);
      const prev = useAppStore.getState().messages[participantId] || [];
      const prevIds = new Set(prev.map((m: any) => m._id));
      const newMsgFromOther = data.filter((m: any) => m.sender !== currentUser!.id && !prevIds.has(m._id));
      
      if (newMsgFromOther.length > 0 && prev.length > 0) {
        playMessageSound();
      }
      
      useAppStore.getState().setMessagesList(participantId, data);
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error('Failed to load message thread', e);
      }
    }
  };

  // Scroll to bottom: instant on first load, smooth on new messages
  useEffect(() => {
    if (!chatEndRef.current) return;
    if (isFirstLoad.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      isFirstLoad.current = false;
    } else {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (isTyping) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isTyping]);

  // Handle typing events with debounce
  const handleTypingInput = (value: string) => {
    setMsgText(value);
    const socket = getSocket();
    if (!localTyping && value.trim()) {
      setLocalTyping(true);
      socket.emit('typing:start', { receiverId: participantId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (localTyping || value.trim()) {
        setLocalTyping(false);
        socket.emit('typing:stop', { receiverId: participantId });
      }
    }, 1500);
  };

  const handleSend = async () => {
    if (!msgText.trim() || !currentUser || isSending) return;
    setIsSending(true);
    const draftText = msgText.trim();
    setMsgText(''); // Instant input clear for absolute responsiveness
    // Stop typing indicator immediately on send
    getSocket().emit('typing:stop', { receiverId: participantId });
    setLocalTyping(false);
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: participantId,
      content: draftText,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // 1. Instantly append message to store
    useAppStore.getState().addMessageLocal(participantId, optimisticMessage);

    try {
      const newMsg = await apiMessages.send(participantId, draftText);
      // 2. Replace optimistic message in store
      useAppStore.setState(state => {
        const thread = state.messages[participantId] || [];
        return {
          messages: {
            ...state.messages,
            [participantId]: thread.map(m => m._id === tempId ? newMsg : m)
          }
        };
      });
    } catch (e) {
      console.error('Failed to send message', e);
      // Revert optimistic message and restore draft
      useAppStore.setState(state => {
        const thread = state.messages[participantId] || [];
        return {
          messages: {
            ...state.messages,
            [participantId]: thread.filter(m => m._id !== tempId)
          }
        };
      });
      setMsgText(draftText);
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageDoubleClick = async (messageId: string) => {
    const targetEmoji = 'liked';
    
    // Optimistic reaction in store
    useAppStore.getState().updateMessageLocal(participantId, messageId, {
      reactions: [{ userId: currentUser!.id, emoji: targetEmoji }]
    });

    setAnimatingDoubleTap(prev => ({ ...prev, [messageId]: true }));
    setTimeout(() => {
      setAnimatingDoubleTap(prev => ({ ...prev, [messageId]: false }));
    }, 800);

    try {
      await apiMessages.react(messageId, targetEmoji);
    } catch (e) {
      console.error("Failed to react to message", e);
    }
  };

  const handleDeleteChat = async () => {
    if (!currentUser || !participantId) return;
    setDeletingChat(true);
    try {
      const convId = [currentUser.id, participantId].sort().join('_');
      await apiMessages.deleteConversation(convId);
      
      // Clear thread list locally
      useAppStore.setState(state => {
        const newConvs = state.conversations.filter(c => c.participant._id !== participantId);
        const newMsgs = { ...state.messages };
        delete newMsgs[participantId];
        return {
          conversations: newConvs,
          messages: newMsgs
        };
      });
      
      onBack();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingChat(false);
      setShowDeleteModal(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#080016]">
        <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#080016] overflow-hidden relative">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between p-4 border-b border-unseen-800/30 bg-[#080016]/95 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push(`/profile?id=${participantId}`)}>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {activeChat ? (
            <>
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${activeChat.avatarColor || 'from-unseen-500 to-unseen-800'} blur-[6px] opacity-60`} />
                <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${activeChat.avatarColor || 'from-unseen-500 to-unseen-800'} border-[1.5px] border-[#080016]`} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight group-hover:text-unseen-300 transition-colors">{activeChat.displayName}</h2>
                <p className="text-[10px] text-unseen-400 font-mono">@{activeChat.username}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-unseen-900/60" />
              <div className="space-y-1">
                <div className="h-3 bg-unseen-900/60 w-20 rounded" />
                <div className="h-2 bg-unseen-900/30 w-12 rounded" />
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={chatMenuRef}>
          <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showChatMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 w-48 glass bg-[#0a0216]/90 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] z-20 py-2 border border-unseen-700/50"
              >
                <button 
                  onClick={() => { setShowChatMenu(false); setShowDeleteModal(true); }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Chat
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* GPU Accelerated Chat Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 chat-pattern transform-gpu">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
            <p className="text-xs font-mono">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-8 text-gray-500 text-xs mt-12">
            <p className="bg-unseen-900/40 border border-unseen-800/40 rounded-full px-4 py-2 inline-block font-mono text-[10px] text-unseen-300">
              🔒 End-to-End Symmetric Encryption Active
            </p>
            <p className="mt-3">Send a message to start chatting.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUser.id;
            const hasReactions = m.reactions && m.reactions.length > 0;
            return (
              <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${hasReactions ? 'mb-3.5' : 'mb-0.5'}`}>
                <div 
                  onDoubleClick={() => handleMessageDoubleClick(m._id)}
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-md relative select-none ${
                    isMe 
                      ? 'bg-gradient-to-r from-unseen-600 to-unseen-700 text-white rounded-tr-sm' 
                      : 'bg-unseen-900/60 border border-unseen-800/40 text-gray-200 rounded-tl-sm'
                  }`}
                >
                  <AnimatePresence>
                    {animatingDoubleTap[m._id] && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, times: [0, 0.2, 0.6, 1] }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                      >
                        <Heart className="w-12 h-12 text-red-500 fill-current filter drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {(() => {
                    const postLinkRegex = /(\/post\/|\[POST_SHARE:)([a-f\d]{24})\]?/i;
                    const match = m.content.match(postLinkRegex);
                    if (match) {
                      const postId = match[2];
                      const cleanContent = m.content
                        .replace(/https?:\/\/[^\s]+/g, '')
                        .replace(/Check out this post:\s*"[^"]*"/i, '')
                        .replace(/Link:/i, '')
                        .replace(/\[POST_SHARE:[a-f\d]{24}\]/i, '')
                        .trim();
                      return (
                        <div className="space-y-2">
                          {cleanContent && <p className="text-sm font-inter leading-relaxed break-words">{cleanContent}</p>}
                          <SharedPostPreview postId={postId} onClick={() => router.push(`/post/${postId}`)} />
                        </div>
                      );
                    }
                    return <p className="text-sm font-inter leading-relaxed break-words">{m.content}</p>;
                  })()}
                  
                  <span className="block text-[8px] text-white/40 mt-1.5 text-right font-mono">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {hasReactions && (
                    <div className={`absolute -bottom-2.5 ${isMe ? 'right-4' : 'left-4'} flex items-center bg-[#13072b] border border-unseen-700/60 rounded-full px-1.5 py-0.5 shadow-md z-10 text-[10px] select-none pointer-events-none`}>
                      <span className="flex items-center justify-center">
                        {m.reactions?.[0]?.emoji === 'liked' ? <Heart className="w-3 h-3 text-red-500 fill-current drop-shadow-[0_0_3px_rgba(239,68,68,0.8)]" /> : m.reactions?.[0]?.emoji}
                      </span>
                      {(m.reactions?.length || 0) > 1 && (
                        <span className="text-[8px] font-mono text-unseen-300 font-semibold ml-0.5">
                          {m.reactions?.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex justify-start mb-2"
            >
              <div className="bg-unseen-900/60 border border-unseen-800/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-unseen-400 typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-unseen-400 typing-dot" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-unseen-400 typing-dot" style={{ animationDelay: '400ms' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </div>

      {/* GPU Accelerated DM Input Panel, perfectly offset for safe area at bottom */}
      <div className="p-4 border-t border-unseen-800/30 bg-[#080016]/95 pb-[calc(1.2rem+env(safe-area-inset-bottom))] shrink-0">
        <div className="flex items-center space-x-2 bg-unseen-900/40 border border-unseen-800 rounded-full p-1.5 pl-4 shadow-inner">
          <input 
            type="text" 
            value={msgText}
            onChange={(e) => handleTypingInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none py-1.5 font-inter"
            placeholder="Type a message..."
          />
          <button 
            onClick={handleSend} 
            disabled={!msgText.trim() || isSending}
            className="bg-unseen-600 hover:bg-unseen-500 disabled:opacity-50 disabled:bg-unseen-800 text-white p-3 rounded-full transition-all disabled:cursor-not-allowed mr-1 shrink-0 flex items-center justify-center active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Chat Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm glass bg-[#0a0216] border border-unseen-800/60 rounded-3xl p-6 md:p-8 z-10 shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650 via-red-500 to-red-650" />
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white font-poppins mb-2">Delete Chat?</h3>
              <p className="text-sm text-gray-400 font-inter leading-relaxed mb-8">
                This will permanently delete your copy of this conversation. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-unseen-950 border border-unseen-800/80 hover:bg-unseen-900 rounded-xl text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteChat}
                  disabled={deletingChat}
                  className="flex-1 py-3 bg-gradient-to-r from-red-650 to-red-800 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {deletingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
