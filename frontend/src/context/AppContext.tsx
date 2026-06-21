'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { auth, clearAccessToken, notifications as apiNotifications, users as apiUsers, messages as apiMessages } from '../lib/api';
import { playNotificationSound, playMessageSound } from '../lib/sound';
import { getSocket, reconnectSocket, disconnectSocket } from '../lib/socketClient';

export interface User {
  id: string;
  _id?: string;
  username: string;
  displayName: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  avatarColor: string;
  role?: string;
  email?: string;
  emailVerified?: boolean;
}

interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  notifications: any[];
  markNotificationsRead: () => Promise<void>;
  users: any[];
  unreadMessagesCount: number;
  setUnreadMessagesCount: React.Dispatch<React.SetStateAction<number>>;
  isMessagesSynced: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.id || payload._id || null;
  } catch (e) {
    return null;
  }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isMessagesSynced, setIsMessagesSynced] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const isSessionTerminated = useRef(false);

  const fetchNotifications = async () => {
    try {
      const notifs = await apiNotifications.list();
      const mappedNotifs = notifs.map((n: any) => ({
        id: n.id,
        type: n.type,
        fromUserId: n.fromUserId,
        postId: n.postId,
        read: n.isRead,
        timeAgo: n.timeAgo,
        reason: n.reason,
      }));
      setNotifications(mappedNotifs);

      // Collect all fromUsers from the backend notifications list directly
      const fetchedUsers = notifs.map((n: any) => n.fromUser).filter(Boolean);
      if (fetchedUsers.length > 0) {
        setUsers(prev => {
          const merged = [...prev];
          fetchedUsers.forEach(vu => {
            if (vu && !merged.some(u => u.id === vu.id)) {
              merged.push(vu);
            }
          });
          return merged;
        });
      }

      setNotifications(prev => {
        const previousUnreadIds = new Set(prev.filter(n => !n.read).map(n => n.id));
        const hasNewUnread = mappedNotifs.some(n => !n.read && !previousUnreadIds.has(n.id));
        if (hasNewUnread && prev.length > 0) {
          playNotificationSound();
        }
        return mappedNotifs;
      });
    } catch (e: any) {
      if (e?.message !== 'Token expired.' && e?.message !== 'Authentication required.' && e?.message !== 'Invalid token.' && e?.message !== 'Unauthorized') {
        console.error("Failed to fetch notifications", e);
      }
    }
  };

  const markNotificationsRead = async () => {
    try {
      await apiNotifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error("Failed to mark notifications as read", e);
    }
  };

  const handleSessionTerminated = () => {
    isSessionTerminated.current = true;
    clearAccessToken();
    setCurrentUser(null);
    setNotifications([]);
    disconnectSocket();
    setShowSessionModal(true);
  };

  // Sync global unreadMessagesCount from Zustand store conversations
  useEffect(() => {
    const { useAppStore } = require('../lib/store');
    const unsubscribe = useAppStore.subscribe((state: any) => {
      const totalUnread = state.conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
      setUnreadMessagesCount(totalUnread);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      
      const fetchUnreadMessages = async () => {
        try {
          const convs = await apiMessages.getConversations();
          const { useAppStore } = require('../lib/store');
          useAppStore.getState().setConversationsList(convs);
          setIsMessagesSynced(true);
        } catch (e) {
          // Ignore expected errors
        }
      };
      fetchUnreadMessages();
      const msgInterval = setInterval(fetchUnreadMessages, 60000); // 60s poll
      
      const socket = getSocket();
      const { useAppStore } = require('../lib/store');
      const boundSessionVersion = useAppStore.getState().sessionVersion;

      const handleNewNotification = () => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        fetchNotifications();
      };
      
      const handleNewMessage = (msg: any) => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        
        const myId = currentUser.id;
        const otherId = msg.sender === myId ? msg.receiver : msg.sender;
        
        // 1. Prevent duplicate message counts by checking thread local messages cache
        const threadMessages = storeState.messages[otherId] || [];
        if (threadMessages.some((m: any) => m._id === msg._id)) {
          return;
        }

        // 2. Prevent duplicate message counts by checking conversation preview lastMessage
        const currentConversations = [...storeState.conversations];
        const convIdx = currentConversations.findIndex(c => c.participant._id === otherId);
        if (convIdx > -1) {
          const conv = currentConversations[convIdx];
          if (conv.lastMessage && conv.lastMessage._id === msg._id) {
            return;
          }
        }
        
        // Add message to the thread local cache
        storeState.addMessageLocal(otherId, msg);
        
        if (msg.sender !== myId) {
          playMessageSound();
        }
        
        // Update conversations preview, lastMessage, and unreadCount
        const isViewingChat = storeState.activeChatId === otherId;
        if (isViewingChat && msg.sender !== myId) {
          socket.emit('message:read', { senderId: otherId });
        }
        
        if (convIdx > -1) {
          const updatedConv = {
            ...currentConversations[convIdx],
            lastMessage: msg,
            unreadCount: isViewingChat
              ? 0
              : (msg.sender === myId ? currentConversations[convIdx].unreadCount : currentConversations[convIdx].unreadCount + 1)
          };
          currentConversations.splice(convIdx, 1);
          currentConversations.unshift(updatedConv);
          storeState.setConversationsList(currentConversations);
        } else {
          // Refresh list to pull fresh participant details
          fetchUnreadMessages();
        }
      };

      const handleMessageReadSocket = (data: { readBy: string, conversationId: string }) => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        
        const myId = currentUser.id;
        const otherId = data.conversationId.split('_').find((id: string) => id !== myId);
        if (!otherId) return;
        
        if (data.readBy === myId) {
          // We read their messages
          storeState.markConversationAsReadLocal(otherId);
        } else {
          // They read our messages: sync read receipts in message thread
          const thread = storeState.messages[otherId] || [];
          const updatedThread = thread.map((m: any) => m.receiver === otherId ? { ...m, isRead: true } : m);
          useAppStore.setState((state: any) => ({
            messages: {
              ...state.messages,
              [otherId]: updatedThread
            }
          }));
        }
      };
      
      const handleSessionTerminatedSocket = () => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        handleSessionTerminated();
      };

      const handlePostLiked = (data: { postId: string; likesCount: number; userId?: string }) => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        if (data.userId === currentUser.id) return;

        storeState.updatePostLocal(data.postId, {
          likesCount: Math.max(0, data.likesCount),
        });
      };

      const handlePostSaved = (data: { postId: string; savesCount: number; userId?: string }) => {
        const storeState = useAppStore.getState();
        if (storeState.sessionVersion !== boundSessionVersion) return;
        if (data.userId === currentUser.id) return;

        storeState.updatePostLocal(data.postId, {
          savesCount: Math.max(0, data.savesCount),
        });
      };
      
      socket.on('message:receive', handleNewMessage);
      socket.on('message:read', handleMessageReadSocket);
      socket.on('notification:new', handleNewNotification);
      socket.on('session:terminated', handleSessionTerminatedSocket);
      socket.on('post:liked', handlePostLiked);
      socket.on('post:saved', handlePostSaved);
      
      return () => {
        clearInterval(interval);
        clearInterval(msgInterval);
        socket.off('message:receive', handleNewMessage);
        socket.off('message:read', handleMessageReadSocket);
        socket.off('notification:new', handleNewNotification);
        socket.off('session:terminated', handleSessionTerminatedSocket);
        socket.off('post:liked', handlePostLiked);
        socket.off('post:saved', handlePostSaved);
      };
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Sync token to Android native interface on load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (token) {
      const win = window as any;
      if (win.AndroidInterface && typeof win.AndroidInterface.saveToken === 'function') {
        try {
          win.AndroidInterface.saveToken(token);
        } catch (e) {}
      }
    }
  }, []);

  // Issue 6: Deep link redirection on Android mobile browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isInsideApk = ua.includes('UnseenAndroidAPK') || ua.includes('UnseenAPK');

    if (isAndroid && !isInsideApk) {
      const hasRedirected = sessionStorage.getItem('app_link_redirected');
      if (!hasRedirected) {
        sessionStorage.setItem('app_link_redirected', 'true');
        const pathname = window.location.pathname;
        const search = window.location.search;
        const fallbackUrl = window.location.href;
        const intentUrl = `intent://${window.location.host}${pathname}${search}#Intent;scheme=https;package=com.example.unseen;S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
        window.location.href = intentUrl;
      }
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      if (isSessionTerminated.current) return;
      setCurrentUser(null);
      setNotifications([]);
      disconnectSocket();
      if (typeof window !== 'undefined') {
        const publicPaths = [
          '/',
          '/login', '/login/',
          '/signup', '/signup/',
          '/about', '/about/',
          '/privacy', '/privacy/',
          '/terms', '/terms/',
          '/contact', '/contact/',
          '/download', '/download/',
          '/faq', '/faq/'
        ];
        const isPublic = publicPaths.some(
          path => window.location.pathname === path || (path !== '/' && window.location.pathname.startsWith(path + '/'))
        );
        if (!isPublic) {
          window.location.href = '/login?expired=true';
        }
      }
    };
    
    const handleTokenRefreshed = () => {
      reconnectSocket();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('unauthorized', handleUnauthorized);
      window.addEventListener('sessionTerminated', handleSessionTerminated);
      window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const hasToken = typeof window !== 'undefined' && (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken'));
    if (!hasToken) {
      setCurrentUser(null);
      setIsLoading(false);
    } else {
      // Fast session restore from cache (validated by userId)
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            const tokenUserId = getUserIdFromToken(token);
            if (tokenUserId && (parsedUser.id === tokenUserId || parsedUser._id === tokenUserId)) {
              // Increment session version
              const { useAppStore } = require('../lib/store');
              useAppStore.getState().incrementSession();

              setCurrentUser(parsedUser);
              setIsLoading(false); // resolve loader instantly
            } else {
              localStorage.removeItem('cached_user');
            }
          } catch (_) {
            localStorage.removeItem('cached_user');
          }
        }
      }

      // Validate session in background
      auth.getMe()
        .then((user) => {
          const freshUser = { ...user, id: user._id || user.id };
          setCurrentUser(freshUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('cached_user', JSON.stringify(freshUser));
          }
        })
        .catch(() => {
          clearAccessToken();
          setCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cached_user');
            // Clean up caches
            for (let i = localStorage.length - 1; i >= 0; i--) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('cached_') || key.startsWith('profile:') || key.startsWith('feed:') || key.startsWith('notifications:'))) {
                localStorage.removeItem(key);
              }
            }
            sessionStorage.clear();
          }
          window.location.href = '/login?expired=true';
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unauthorized', handleUnauthorized);
        window.removeEventListener('sessionTerminated', handleSessionTerminated);
        window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      }
    };
  }, []);

  const login = (user: User) => {
    // Reset store on login
    const { useAppStore } = require('../lib/store');
    useAppStore.getState().clearAllUserState();
    useAppStore.getState().incrementSession();

    setIsMessagesSynced(false);
    const normalizedUser = { ...user, id: user._id || user.id };
    setCurrentUser(normalizedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cached_user', JSON.stringify(normalizedUser));
    }
    reconnectSocket();
  };

  const logout = async () => {
    try {
      await auth.logout();
    } catch (e) {
      // Ignore errors
    } finally {
      clearAccessToken();
      setCurrentUser(null);
      disconnectSocket();
      
      // Wipe out all cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cached_user');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('cached_') || key.startsWith('profile:') || key.startsWith('feed:') || key.startsWith('notifications:'))) {
            localStorage.removeItem(key);
          }
        }
        sessionStorage.clear();
      }
      
      // Reset Zustand store
      const { useAppStore } = require('../lib/store');
      useAppStore.getState().clearAllUserState();
      useAppStore.getState().incrementSession();

      setUnreadMessagesCount(0);
      setIsMessagesSynced(false);
      setNotifications([]);
      
      window.location.href = '/login';
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev: User | null) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AppContext.Provider value={{ currentUser, isLoading, login, logout, updateCurrentUser, notifications, markNotificationsRead, users, unreadMessagesCount, setUnreadMessagesCount, isMessagesSynced }}>
      {children}

      {showSessionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative w-full max-w-sm glass bg-[#0a0216]/90 border border-unseen-800/60 rounded-3xl p-6 md:p-8 z-10 shadow-[0_0_50px_rgba(157,78,221,0.25)] text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-unseen-500 via-purple-500 to-unseen-500" />
            <div className="mx-auto w-12 h-12 bg-unseen-500/10 rounded-full flex items-center justify-center mb-4 border border-unseen-500/20">
              <svg className="w-6 h-6 text-unseen-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-poppins mb-2">Session Ended</h3>
            <p className="text-sm text-gray-400 font-inter leading-relaxed mb-6">
              Your account has been logged in on another device. This session has been ended for security reasons.
            </p>
            <button
              onClick={() => {
                setShowSessionModal(false);
                window.location.href = '/login';
              }}
              className="w-full py-3 bg-gradient-to-r from-unseen-600 to-purple-650 hover:shadow-[0_0_20px_rgba(123,44,191,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
