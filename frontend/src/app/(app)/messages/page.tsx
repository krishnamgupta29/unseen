'use client';
export const dynamic = "force-dynamic";
import { Search, Send, ChevronLeft, MessageSquare, Loader2, Heart, MoreHorizontal, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import Header from '@/components/layout/Header';
import { useAppContext } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { messages as apiMessages, users as apiUsers, feed } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { playMessageSound } from '@/lib/sound';
import PostCard from '@/components/PostCard';
import { getSocket } from '@/lib/socketClient';

interface Conversation {
  conversationId: string;
  unreadCount: number;
  lastMessage: {
    _id: string;
    sender: string;
    receiver: string;
    content: string;
    createdAt: string;
  };
  participant: {
    _id: string;
    username: string;
    displayName: string;
    avatarColor: string;
  };
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
  reactions?: { userId: string; emoji: string }[];
}

interface SharedPostPreviewProps {
  postId: string;
  onClick: () => void;
}

function SharedPostPreview({ postId, onClick }: SharedPostPreviewProps) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    feed.getPostById(postId)
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
        Deleted Whisper
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

function PostCardWrapper({ postId }: { postId: string }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feed.getPostById(postId)
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [postId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-sm">This whisper has faded back into the void or has been deleted.</p>
      </div>
    );
  }

  return <PostCard post={post} />;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAppContext();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  const [activeChat, setActiveChat] = useState<{
    _id: string;
    username: string;
    displayName: string;
    avatarColor: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [animatingDoubleTap, setAnimatingDoubleTap] = useState<Record<string, boolean>>({});
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) setShowChatMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const handleDeleteChat = async () => {
    if (!currentUser || !activeChat) return;
    setDeletingChat(true);
    try {
      const convId = [currentUser.id, activeChat._id].sort().join('_');
      await apiMessages.deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.participant._id !== activeChat._id));
      setActiveChat(null);
      setShowDeleteModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingChat(false);
    }
  };

  const handleMessageDoubleClick = async (messageId: string, receiverId: string) => {
    const targetEmoji = 'liked';
    
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        const reactions = m.reactions ? [...m.reactions] : [];
        const existingIndex = reactions.findIndex(r => r.userId === currentUser?.id && r.emoji === targetEmoji);
        
        if (existingIndex > -1) {
          reactions.splice(existingIndex, 1);
        } else {
          const index = reactions.findIndex(r => r.userId === currentUser?.id);
          if (index > -1) {
            reactions[index].emoji = targetEmoji;
          } else {
            reactions.push({ userId: currentUser!.id, emoji: targetEmoji });
          }
        }
        return { ...m, reactions };
      }
      return m;
    }));

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

  // 1. Fetch conversations on mount and socket events
  useEffect(() => {
    if (!currentUser) return;
    
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // 15s fallback poll
    
    const socket = getSocket();
    const handleRefreshConversations = () => {
      fetchConversations();
    };
    
    socket.on('message:receive', handleRefreshConversations);
    socket.on('message:read', handleRefreshConversations);
    
    return () => {
      clearInterval(interval);
      socket.off('message:receive', handleRefreshConversations);
      socket.off('message:read', handleRefreshConversations);
    };
  }, [currentUser]);

  const fetchConversations = async () => {
    try {
      const data = await apiMessages.getConversations();
      setConversations(data as any);
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error('Failed to load conversations', e);
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  // 2. Handle ?start=userId from query parameters to open new DMs
  useEffect(() => {
    const startId = searchParams.get('start');
    if (startId && currentUser) {
      apiUsers.getProfile(startId)
        .then((user) => {
          setActiveChat({
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatarColor: user.avatarColor || 'from-unseen-500 to-unseen-800'
          });
          // Clean the query parameter from URL
          router.replace('/messages');
        })
        .catch((err) => console.error('Failed to load target message user', err));
    }
  }, [searchParams, currentUser]);

  // 3. Load messages when activeChat changes and register socket listeners
  useEffect(() => {
    if (!activeChat || !currentUser) {
      setMessages([]);
      return;
    }
    
    loadMessages();
    const interval = setInterval(loadMessages, 15000); // 15s fallback poll
    
    const socket = getSocket();
    
    const handleNewMessage = (msg: any) => {
      if (activeChat && (msg.sender === activeChat._id || msg.receiver === activeChat._id)) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          if (msg.sender !== currentUser.id) {
            playMessageSound();
          }
          return [...prev, msg];
        });
        
        if (msg.sender === activeChat._id) {
          socket.emit('message:read', { senderId: activeChat._id });
        }
      }
    };
    
    const handleReactionAdd = (data: { messageId: string; emoji: string; userId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m._id === data.messageId) {
          const reactions = m.reactions ? [...m.reactions] : [];
          const existingIndex = reactions.findIndex(r => r.userId === data.userId);
          if (existingIndex > -1) {
            reactions[existingIndex].emoji = data.emoji;
          } else {
            reactions.push({ userId: data.userId, emoji: data.emoji });
          }
          return { ...m, reactions };
        }
        return m;
      }));
    };
    
    const handleMessageRead = (data: { readBy: string }) => {
      // Optional: handle read receipts in real-time
    };

    socket.on('message:receive', handleNewMessage);
    socket.on('reaction:add', handleReactionAdd);
    socket.on('message:read', handleMessageRead);

    return () => {
      clearInterval(interval);
      socket.off('message:receive', handleNewMessage);
      socket.off('reaction:add', handleReactionAdd);
      socket.off('message:read', handleMessageRead);
    };
  }, [activeChat, currentUser]);

  const loadMessages = async () => {
    if (!activeChat) return;
    try {
      const data = await apiMessages.getMessages(activeChat._id);
      setMessages(prev => {
        const prevIds = new Set(prev.map((m: any) => m._id));
        const newMsgFromOther = data.filter((m: any) => m.sender !== currentUser!.id && !prevIds.has(m._id));
        if (newMsgFromOther.length > 0 && prev.length > 0) {
          playMessageSound();
        }
        return data as any;
      });
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error('Failed to load message thread', e);
      }
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!msgText.trim() || !activeChat || isSending) return;
    setIsSending(true);
    const draftText = msgText.trim();
    setMsgText(''); // Clear instantly for responsiveness
    
    try {
      const newMsg = await apiMessages.send(activeChat._id, draftText);
      setMessages(prev => [...prev, newMsg]);
      fetchConversations(); // refresh sidebar list
    } catch (e) {
      console.error('Failed to send message', e);
      setMsgText(draftText); // restore draft if failed
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] md:h-screen flex flex-col relative overflow-hidden">
      {!activeChat ? (
        <>
          <Header title="Secure Whispers" />
          
          {/* Conversation Search Bar */}
          <div className="p-4 border-b border-unseen-800/30 bg-[#080016]/50">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                className="w-full bg-unseen-900/50 border border-unseen-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-unseen-500 transition-colors"
                placeholder="Search secure threads..."
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-unseen-400 mb-2" />
                <p className="text-sm">Decrypting secure protocols...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 h-full mt-12">
                <div className="w-16 h-16 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30">
                  <MessageSquare className="w-7 h-7 text-unseen-400 opacity-60" />
                </div>
                <p className="text-lg font-semibold text-gray-200">No active threads</p>
                <p className="text-xs mt-1.5 max-w-xs text-gray-400 leading-relaxed">
                  Go to the Feed, click on any shadow's profile name, and tap the Message icon to initiate an untraceable, end-to-end encrypted conversation.
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2">Conversations</h3>
                {conversations.map(c => (
                  <div 
                    key={c.conversationId}
                    onClick={() => setActiveChat(c.participant)}
                    className="flex items-center space-x-3.5 p-3.5 hover:bg-unseen-800/20 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-unseen-800/30"
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${c.participant.avatarColor || 'from-unseen-500 to-unseen-800'} blur-[8px] opacity-60`} />
                      <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${c.participant.avatarColor || 'from-unseen-500 to-unseen-800'} border-2 border-[#080016]`}>
                        {/* Pure colored orb */}
                      </div>
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-unseen-500 text-white font-bold font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#080016] shadow-[0_0_8px_#7b2cbf]">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-white text-sm font-semibold truncate">{c.participant.displayName}</p>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-unseen-200 font-semibold' : 'text-gray-400'}`}>
                        {c.lastMessage.sender === currentUser.id ? 'You: ' : ''}
                        {c.lastMessage.content.match(/(\/post\/|\[POST_SHARE:)[a-f\d]{24}/i) ? 'Shared a whisper' : c.lastMessage.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        // Active Chat View
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="fixed inset-0 md:relative z-[60] md:z-10 flex flex-col w-full h-full bg-[#080016]"
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-unseen-800/30 bg-[#080016]/95 backdrop-blur-md z-10">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push(`/profile?id=${activeChat._id}`)}>
              <button onClick={(e) => { e.stopPropagation(); setActiveChat(null); }} className="p-1.5 -ml-1 text-gray-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-shrink-0">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${activeChat.avatarColor || 'from-unseen-500 to-unseen-800'} blur-[6px] opacity-60`} />
                <div className={`relative w-9 h-9 rounded-full bg-gradient-to-br ${activeChat.avatarColor || 'from-unseen-500 to-unseen-800'} border-[1.5px] border-[#080016]`}>
                  {/* Pure colored orb */}
                </div>
              </div>
              <div>
                <h2 className="text-white font-bold text-sm leading-tight group-hover:text-unseen-300 transition-colors">{activeChat.displayName}</h2>
                <p className="text-[10px] text-unseen-400 font-mono">@{activeChat.username}</p>
              </div>
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

          {/* Chat Messages */}
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 chat-pattern">
            {messages.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-xs mt-12">
                <p className="bg-unseen-900/40 border border-unseen-800/40 rounded-full px-4 py-2 inline-block font-mono text-[10px] text-unseen-300">
                  🔒 End-to-End Symmetric Encryption Active
                </p>
                <p className="mt-3">Say hello to claim your untraceable thread.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender === currentUser.id;
                const hasReactions = m.reactions && m.reactions.length > 0;
                return (
                  <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${hasReactions ? 'mb-3.5' : 'mb-0.5'}`}>
                    <div 
                      onDoubleClick={() => handleMessageDoubleClick(m._id, isMe ? m.receiver : m.sender)}
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
                        // Match old URL format or new [POST_SHARE:id] format
                        const postLinkRegex = /(\/post\/|\[POST_SHARE:)([a-f\d]{24})\]?/i;
                        const match = m.content.match(postLinkRegex);
                        if (match) {
                          const postId = match[2];
                          // Strip the format for clean display (if it's old text format)
                          const cleanContent = m.content
                            .replace(/https?:\/\/[^\s]+/g, '')
                            .replace(/Check out this whisper:\s*"[^"]*"/i, '')
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
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-3.5 border-t border-unseen-800/30 bg-[#080016]/95">
            <div className="flex items-center space-x-2 bg-unseen-900/40 border border-unseen-800 rounded-full p-1 pl-4">
              <input 
                type="text" 
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-white placeholder-gray-500 text-xs focus:outline-none py-1.5"
                placeholder="Whisper back..."
              />
              <button 
                onClick={handleSend} 
                disabled={!msgText.trim() || isSending}
                className="bg-unseen-600 hover:bg-unseen-500 disabled:opacity-50 disabled:bg-unseen-800 text-white p-2.5 rounded-full transition-all disabled:cursor-not-allowed mr-1 shrink-0 flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
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
                  className="absolute inset-0 bg-black backdrop-blur-md"
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
                      className="flex-1 py-3 bg-unseen-950 border border-unseen-800/80 hover:bg-unseen-900 rounded-xl text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteChat}
                      disabled={deletingChat}
                      className="flex-1 py-3 bg-gradient-to-r from-red-650 to-red-800 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {deletingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          
        </motion.div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-unseen-400" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
