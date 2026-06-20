'use client';

export const dynamic = "force-dynamic";
import { Search, MessageSquare, Loader2, Shield } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import Header from '@/components/layout/Header';
import { useAppContext } from '@/context/AppContext';
import { messages as apiMessages } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSocket } from '@/lib/socketClient';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import ChatThread from '@/components/ChatThread';

function MessagesContent() {
  const router = useRouter();
  const { currentUser } = useAppContext();
  const searchParams = useSearchParams();
  const startId = searchParams.get('start');
  const queryId = searchParams.get('id');
  
  const activeChatUserId = queryId || startId || null;

  const handleSelectChat = (participantId: string) => {
    // Fast inline navigation using query params instead of slow Next.js page change
    router.push(`/messages?id=${participantId}`);
  };

  const handleClearChat = () => {
    router.push('/messages');
  };
  
  // Use store cached conversations list
  const conversations = useAppStore(useShallow(state => state.conversations));
  const [loadingConversations, setLoadingConversations] = useState(conversations.length === 0);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations on mount and socket events
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
      useAppStore.getState().setConversationsList(data);
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error('Failed to load conversations', e);
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#080016]">
        <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
      </div>
    );
  }

  // Filter conversations based on user search query
  const filteredConversations = conversations.filter(c => 
    c.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[calc(100dvh-5rem)] md:h-screen flex bg-[#080016] relative overflow-hidden">
      {/* List Pane */}
      <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 flex flex-col h-full border-r border-unseen-800/30 bg-[#080016] pb-4 md:pb-0 ${
        activeChatUserId ? 'hidden md:flex' : 'flex'
      }`}>
        <Header title="Messages" />
        
        {/* Conversation Search Bar */}
        <div className="p-4 border-b border-unseen-800/30 bg-[#080016]/50">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-unseen-900/50 border border-unseen-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-unseen-500 transition-colors"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-unseen-400 mb-3" />
              <p className="text-sm font-mono text-unseen-300">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-unseen-900/40 flex items-center justify-center mb-4 border border-unseen-800/30">
                <MessageSquare className="w-7 h-7 text-unseen-400 opacity-60" />
              </div>
              <p className="text-lg font-semibold text-gray-200">No conversations yet</p>
              <p className="text-xs mt-1.5 max-w-xs text-gray-400 leading-relaxed">
                Go to the Feed, click on any user's profile, and tap the Message icon to start a conversation.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 py-2">Conversations</h3>
              {filteredConversations.map(c => {
                const isSelected = activeChatUserId === c.participant._id;
                return (
                  <div 
                    key={c.conversationId}
                    onClick={() => c.participant._id && handleSelectChat(c.participant._id)}
                    className={`flex items-center space-x-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-unseen-800/30 border-unseen-500/30 shadow-[0_0_15px_rgba(123,44,191,0.15)]' 
                        : 'hover:bg-unseen-800/20 border-transparent hover:border-unseen-800/30'
                    }`}
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
                        {c.lastMessage.content.match(/(\/post\/|\[POST_SHARE:)[a-f\d]{24}/i) ? 'Shared a post' : c.lastMessage.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Pane */}
      <div className={`flex-1 h-full bg-[#080016] z-10 ${
        activeChatUserId ? 'flex' : 'hidden md:flex items-center justify-center'
      }`}>
        {activeChatUserId ? (
          <ChatThread participantId={activeChatUserId} onBack={handleClearChat} />
        ) : (
          <div className="text-center p-8 text-gray-500 max-w-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-unseen-900/30 flex items-center justify-center mb-4 border border-unseen-800/40 shadow-[0_0_20px_rgba(157,78,221,0.05)]">
              <Shield className="w-8 h-8 text-unseen-500 opacity-60" />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5 font-poppins">Select a conversation</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-inter">
              Select a conversation from the list to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-[#080016]">
        <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
