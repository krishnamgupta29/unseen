'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  Profile, 
  Post, 
  Conversation, 
  Notification, 
  Message,
  Comment,
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
  currentUser: Profile;
  userPosts: Post[];
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
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [currentUser, setCurrentUser] = useState<Profile>(initialCurrentUser);
  const [comments, setComments] = useState<Record<string, Comment[]>>(initialComments);
  const [theme, setThemeState] = useState<ThemeType>('blue');
  const [followingList, setFollowingList] = useState<string[]>(
    initialProfiles.filter(p => p.isFollowing).map(p => p.id)
  );
  const [savedPosts, setSavedPosts] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-teal', 'theme-rose', 'theme-emerald');
    if (theme !== 'blue') {
      document.documentElement.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeType) => {
    setThemeState(newTheme);
  }, []);

  const followProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.map(p => 
      p.id === profileId 
        ? { ...p, isFollowing: true, followersCount: p.followersCount + 1 }
        : p
    ));
    setFollowingList(prev => [...prev, profileId]);
    setCurrentUser(prev => ({ ...prev, followingCount: prev.followingCount + 1 }));
  }, []);

  const unfollowProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.map(p => 
      p.id === profileId 
        ? { ...p, isFollowing: false, followersCount: Math.max(0, p.followersCount - 1) }
        : p
    ));
    setFollowingList(prev => prev.filter(id => id !== profileId));
    setCurrentUser(prev => ({ ...prev, followingCount: Math.max(0, prev.followingCount - 1) }));
  }, []);

  const isFollowing = useCallback((profileId: string) => {
    return followingList.includes(profileId);
  }, [followingList]);

  const getFollowers = useCallback(() => {
    return profiles.slice(0, 5);
  }, [profiles]);

  const getFollowing = useCallback(() => {
    return profiles.filter(p => followingList.includes(p.id));
  }, [profiles, followingList]);

  const likePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: true, likes: p.likes + 1 } : p
    ));
    setUserPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: true, likes: p.likes + 1 } : p
    ));
  }, []);

  const unlikePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: false, likes: Math.max(0, p.likes - 1) } : p
    ));
    setUserPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: false, likes: Math.max(0, p.likes - 1) } : p
    ));
  }, []);

  const savePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: true } : p
    ));
    setUserPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: true } : p
    ));
    setSavedPosts(prev => [...prev, postId]);
  }, []);

  const unsavePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: false } : p
    ));
    setUserPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isSaved: false } : p
    ));
    setSavedPosts(prev => prev.filter(id => id !== postId));
  }, []);

  const getSavedPosts = useCallback(() => {
    return [...posts, ...userPosts].filter(p => savedPosts.includes(p.id));
  }, [posts, userPosts, savedPosts]);

  const addPost = useCallback((post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      ...post,
      id: `user-${Date.now()}`,
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
    };
    setUserPosts(prev => [newPost, ...prev]);
    setCurrentUser(prev => ({ ...prev, postsCount: prev.postsCount + 1 }));
  }, []);

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
    if (id === 'me') return currentUser;
    return profiles.find(p => p.id === id);
  }, [profiles, currentUser]);

  const getPostsByProfile = useCallback((profileId: string): Post[] => {
    if (profileId === 'me') return userPosts;
    const profilePosts = posts.filter(p => p.profileId === profileId);
    return profileId === 'me' ? [...userPosts, ...profilePosts] : profilePosts;
  }, [posts, userPosts]);

  const getConversation = useCallback((id: string): Conversation | undefined => {
    return conversations.find(c => c.id === id);
  }, [conversations]);

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
    setUserPosts(prev => prev.map(p =>
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

  return (
    <AppContext.Provider value={{
      profiles,
      posts,
      conversations,
      notifications,
      currentUser,
      userPosts,
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
