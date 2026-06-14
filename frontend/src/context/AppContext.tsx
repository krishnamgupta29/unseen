'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, clearAccessToken, notifications as apiNotifications, users as apiUsers, messages as apiMessages } from '../lib/api';
import { playNotificationSound } from '../lib/sound';
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
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

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

      // Also fetch unread messages count
      try {
        const convs = await apiMessages.getConversations();
        const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(totalUnread);
      } catch (e) {
        // Ignore expected errors
      }
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

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10s poll fallback
      
      const socket = getSocket();
      const handleNewNotification = () => {
        fetchNotifications();
      };
      
      socket.on('message:receive', handleNewNotification);
      socket.on('notification:new', handleNewNotification);
      
      return () => {
        clearInterval(interval);
        socket.off('message:receive', handleNewNotification);
        socket.off('notification:new', handleNewNotification);
      };
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setNotifications([]);
      disconnectSocket();
      if (typeof window !== 'undefined') {
        const publicPaths = ['/', '/login', '/signup', '/about', '/privacy', '/terms', '/contact', '/download', '/faq'];
        const isPublic = publicPaths.some(
          path => window.location.pathname === path || (path !== '/' && window.location.pathname.startsWith(path + '/'))
        );
        if (!isPublic) {
          window.location.href = '/login';
        }
      }
    };
    
    const handleTokenRefreshed = () => {
      reconnectSocket();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('unauthorized', handleUnauthorized);
      window.addEventListener('tokenRefreshed', handleTokenRefreshed);
    }

    const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');
    if (!hasToken) {
      setCurrentUser(null);
      setIsLoading(false);
    } else {
      // Sync token to Android native interface on load
      const win = window as any;
      if (win.AndroidInterface && typeof win.AndroidInterface.saveToken === 'function') {
        try {
          win.AndroidInterface.saveToken(hasToken);
        } catch (e) {}
      }

      // Attempt to fetch the current user session
      auth.getMe()
        .then((user) => {
          setCurrentUser({ ...user, id: user._id || user.id });
        })
        .catch(() => {
          // If it fails (e.g., no token or expired), clear everything
          setCurrentUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unauthorized', handleUnauthorized);
        window.removeEventListener('tokenRefreshed', handleTokenRefreshed);
      }
    };
  }, []);

  const login = (user: User) => {
    setCurrentUser({ ...user, id: user._id || user.id });
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
      window.location.href = '/login';
    }
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser((prev: User | null) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AppContext.Provider value={{ currentUser, isLoading, login, logout, updateCurrentUser, notifications, markNotificationsRead, users, unreadMessagesCount, setUnreadMessagesCount }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
