'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  Profile, 
  Post, 
  Conversation, 
  Notification, 
  Message,
  Comment
} from '@/lib/types';
import {
  profiles as initialProfiles, 
  posts as initialPosts, 
  conversations as initialConversations, 
  notifications as initialNotifications,
  currentUser as initialCurrentUser,
  initialComments
} from '@/lib/mock-data';

interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  moodTag?: string;
  avatarGradient?: string;
}

type ThemeType = 'blue' | 'purple' | 'teal' | 'rose' | 'emerald';

interface AppState {
  profiles: Profile[];
  posts: Post[];
  conversations: Conversation[];
  notifications: Notification[];
  currentUser: Profile | null;
  comments: Record<string, Comment[]>;
  theme: ThemeType;
  followingList: string[];
  savedPosts: string[];
  setTheme: (theme: ThemeType) => void;
  followProfile: (profileId: string) => void;
  unfollowProfile: (profileId: string) => void;
  isFollowing: (profileId: string) => boolean;
  getFollowers: () => Profile[];
  getFollowing: () => Profile[];
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  savePost: (postId: string) => void;
  unsavePost: (postId: string) => void;
  getSavedPosts: () => Post[];
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => void;
  addMessage: (conversationId: string, content: string, type?: 'text' | 'voice', waveform?: number[], duration?: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  updateProfile: (updates: ProfileUpdate) => void;
  getProfile: (id: string) => Profile | undefined;
  getPostsByProfile: (profileId: string) => Post[];
  getConversation: (id: string) => Conversation | undefined;
  getComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, parentId?: string) => void;
  likeComment: (postId: string, commentId: string) => void;
  login: (user: Profile) => void;
  logout: () => void;
  refreshFeed: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [theme, setThemeState] = useState<ThemeType>('blue');
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/init');
        const data = await res.json();
        if (data.users) setProfiles(data.users.map((u: any) => ({ ...u, id: u._id })));
        if (data.posts) setPosts(data.posts.map((p: any) => ({ 
          ...p, 
          id: p._id, 
          profileId: p.profileId?._id || p.profileId,
          timestamp: new Date(p.createdAt || new Date()).toISOString(),
          comments: p.comments?.length || (Array.isArray(p.comments) ? p.comments.length : typeof p.comments === 'number' ? p.comments : 0)
        })));
        // Add more mapping as needed
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();

    // Auto-refresh interval (every 30s)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const refreshFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts.map((p: any) => ({ 
          ...p, 
          id: p._id, 
          profileId: p.profileId?._id || p.profileId,
          timestamp: new Date(p.createdAt || new Date()).toISOString(),
          comments: p.comments?.length || (Array.isArray(p.comments) ? p.comments.length : typeof p.comments === 'number' ? p.comments : 0)
        })));
      }
    } catch (err) {
      console.error("Failed to refresh feed:", err);
    }
  }, []);

  useEffect(() => {

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-teal', 'theme-rose', 'theme-emerald');
    if (theme !== 'blue') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  const followProfile = useCallback(async (profileId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id, targetId: profileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowingList(prev => [...prev, profileId]);
        setProfiles(prev => prev.map(p => 
          p.id === profileId 
            ? { ...p, followersCount: p.followersCount + 1 }
            : p
        ));
        setCurrentUser(prev => prev ? { ...prev, followingCount: prev.followingCount + 1 } : null);
      }
    } catch (err) {
      console.error("Follow failed:", err);
    }
  }, [currentUser]);

  const unfollowProfile = useCallback(async (profileId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/users/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id, targetId: profileId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowingList(prev => prev.filter(id => id !== profileId));
        setProfiles(prev => prev.map(p => 
          p.id === profileId 
            ? { ...p, followersCount: Math.max(0, p.followersCount - 1) }
            : p
        ));
        setCurrentUser(prev => prev ? { ...prev, followingCount: Math.max(0, prev.followingCount - 1) } : null);
      }
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
  }, [currentUser]);

  const isFollowing = useCallback((profileId: string) => {
    return followingList.includes(profileId);
  }, [followingList]);

  const getFollowers = useCallback(() => {
    // In a real app, this would fetch from the server
    // For now, let's return an empty list or filter by who is following 'me' if we had that data
    return []; 
  }, []);

  const getFollowing = useCallback(() => {
    return profiles.filter(p => followingList.includes(p.id));
  }, [profiles, followingList]);

  const likePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: true, likes: p.likes + 1 } : p
    ));
  }, []);

  const unlikePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: false, likes: Math.max(0, p.likes - 1) } : p
    ));
  }, []);

  const savePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: true } : p
    ));
    setSavedPosts(prev => [...prev, postId]);
  }, []);

  const unsavePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: false } : p
    ));
    setSavedPosts(prev => prev.filter(id => id !== postId));
  }, []);

  const getSavedPosts = useCallback(() => {
    return posts.filter(p => savedPosts.includes(p.id));
  }, [posts, savedPosts]);

  const addPost = useCallback(async (postData: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postData, userId: currentUser.id }),
      });
      const newPost = await res.json();
      if (res.ok) {
        setPosts(prev => [{ ...newPost, id: newPost._id, timestamp: 'Just now' }, ...prev]);
        setCurrentUser(prev => prev ? { ...prev, postsCount: (prev.postsCount || 0) + 1 } : null);
      }
    } catch (err) {
      console.error("Failed to add post:", err);
    }
  }, [currentUser]);

  const addMessage = useCallback((
    conversationId: string, 
    content: string, 
    type: 'text' | 'voice' = 'text',
    waveform?: number[],
    duration?: string
  ) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      content,
      timestamp: 'Just now',
      isMe: true,
      type,
      waveform,
      duration,
    };
    setConversations(prev => prev.map(c => 
      c.id === conversationId
        ? { 
            ...c, 
            messages: [...c.messages, newMessage],
            lastMessage: type === 'voice' ? '🎤 Voice message' : content,
            timestamp: 'Just now',
          }
        : c
    ));
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const updateProfile = useCallback((updates: ProfileUpdate) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const getProfile = useCallback((id: string): Profile | undefined => {
    if (id === 'me' || id === currentUser?.id) return currentUser || undefined;
    return profiles.find(p => p.id === id);
  }, [profiles, currentUser]);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

  const getPostsByProfile = useCallback((profileId: string): Post[] => {
    return posts.filter(p => p.profileId === profileId);
  }, [posts]);

  const getComments = useCallback((postId: string): Comment[] => {
    return comments[postId] || [];
  }, [comments]);

  const addComment = useCallback((postId: string, content: string, parentId?: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      content,
      timestamp: 'Just now',
      likes: 0,
      isLiked: false,
      parentId,
    };
    setComments(prev => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] || [])],
    }));
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: p.comments + 1 } : p
    ));
  }, []);

  const likeComment = useCallback((postId: string, commentId: string) => {
    setComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c =>
        c.id === commentId 
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      ),
    }));
  }, []);

  const login = useCallback((user: Profile) => {
    const fixedUser = { ...user, followingCount: user.followingCount || 0 };
    setCurrentUser(fixedUser);
    localStorage.setItem('user', JSON.stringify(fixedUser));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  }, []);

  return (
    <AppContext.Provider value={{
      profiles,
      posts,
      conversations,
      notifications,
      currentUser,
      comments,
      theme,
      followingList,
      savedPosts,
      setTheme,
      followProfile,
      unfollowProfile,
      isFollowing,
      getFollowers,
      getFollowing,
      likePost,
      unlikePost,
      savePost,
      unsavePost,
      getSavedPosts,
      addPost,
      addMessage,
      markNotificationRead,
      markAllNotificationsRead,
      updateProfile,
      getProfile,
      getPostsByProfile,
      getConversation,
      getComments,
      addComment,
      likeComment,
      login,
      logout,
      refreshFeed,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
