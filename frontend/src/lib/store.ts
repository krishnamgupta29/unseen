import { create } from 'zustand';
import { feed as apiFeed, users as apiUsers, comments as apiComments, messages as apiMessages } from './api';

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
  isFollowing?: boolean;
}

export interface Post {
  _id: string;
  content: string;
  author: User;
  moodTag?: string;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewCount: number;
  shareCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  createdAt: string;
  reactions?: { userId: string; emoji: string }[];
}

export interface Conversation {
  conversationId: string;
  unreadCount: number;
  lastMessage: Message;
  participant: User;
}

interface AppStoreState {
  // Cache storage
  posts: Record<string, Post>;
  profiles: Record<string, User>;
  feeds: Record<string, string[]>; // feedName -> array of postIds
  conversations: Conversation[];
  messages: Record<string, Message[]>; // participantId -> messages
  
  // Pending locks to prevent rapid repeated clicks
  locks: Record<string, boolean>;

  // Post Actions
  setPost: (post: any) => void;
  setPostsList: (postsList: any[]) => void;
  updatePostLocal: (postId: string, updates: Partial<Post>) => void;
  removePostLocal: (postId: string) => void;
  
  // Feed Actions
  setFeed: (feedName: string, postsList: any[]) => void;
  prependToFeed: (feedName: string, post: any) => void;
  
  // Profile Actions
  setProfile: (userId: string, profile: any) => void;
  updateProfileLocal: (userId: string, updates: Partial<User>) => void;
  
  // Conversations & Messages Actions
  setConversationsList: (conversationsList: any[]) => void;
  setMessagesList: (participantId: string, messagesList: any[]) => void;
  addMessageLocal: (participantId: string, message: Message) => void;
  updateMessageLocal: (participantId: string, messageId: string, updates: Partial<Message>) => void;

  // Optimistic Operations
  toggleLikePost: (postId: string) => Promise<void>;
  toggleSavePost: (postId: string) => Promise<void>;
  toggleFollowUser: (userId: string, currentUserId?: string) => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  posts: {},
  profiles: {},
  feeds: {},
  conversations: [],
  messages: {},
  locks: {},

  // Set individual post to cache
  setPost: (post) => {
    if (!post?._id) return;
    const normalizedAuthor = post.author ? {
      ...post.author,
      id: post.author._id || post.author.id
    } : null;
    
    const normalizedPost = {
      ...post,
      author: normalizedAuthor
    };
    
    set((state) => ({
      posts: { ...state.posts, [post._id]: normalizedPost }
    }));
  },

  // Set multiple posts to cache
  setPostsList: (postsList) => {
    const newPostsMap: Record<string, Post> = {};
    postsList.forEach((post) => {
      if (post?._id) {
        const normalizedAuthor = post.author ? {
          ...post.author,
          id: post.author._id || post.author.id
        } : null;
        newPostsMap[post._id] = {
          ...post,
          author: normalizedAuthor
        };
      }
    });
    set((state) => ({
      posts: { ...state.posts, ...newPostsMap }
    }));
  },

  // Update post local state directly in cache
  updatePostLocal: (postId, updates) => {
    set((state) => {
      const existing = state.posts[postId];
      if (!existing) return {};
      return {
        posts: {
          ...state.posts,
          [postId]: { ...existing, ...updates }
        }
      };
    });
  },

  // Delete post from local cache
  removePostLocal: (postId) => {
    set((state) => {
      const newPosts = { ...state.posts };
      delete newPosts[postId];
      
      // Remove from all feeds as well
      const newFeeds: Record<string, string[]> = {};
      Object.keys(state.feeds).forEach((key) => {
        newFeeds[key] = state.feeds[key].filter(id => id !== postId);
      });

      return {
        posts: newPosts,
        feeds: newFeeds
      };
    });
  },

  // Populate Feed
  setFeed: (feedName, postsList) => {
    // 1. Add posts to general cache
    get().setPostsList(postsList);
    // 2. Store post IDs for this specific feed
    const postIds = postsList.map(p => p._id).filter(Boolean);
    set((state) => ({
      feeds: { ...state.feeds, [feedName]: postIds }
    }));
  },

  // Prepend post to feed
  prependToFeed: (feedName, post) => {
    get().setPost(post);
    set((state) => {
      const existingFeed = state.feeds[feedName] || [];
      if (existingFeed.includes(post._id)) return {};
      return {
        feeds: {
          ...state.feeds,
          [feedName]: [post._id, ...existingFeed]
        }
      };
    });
  },

  // Cache user profile
  setProfile: (userId, profile) => {
    if (!userId) return;
    const normalizedProfile = {
      ...profile,
      id: profile._id || profile.id
    };
    set((state) => ({
      profiles: { ...state.profiles, [userId]: normalizedProfile }
    }));
  },

  // Update user profile in local cache
  updateProfileLocal: (userId, updates) => {
    set((state) => {
      const existing = state.profiles[userId];
      if (!existing) return {};
      return {
        profiles: {
          ...state.profiles,
          [userId]: { ...existing, ...updates }
        }
      };
    });
  },

  // Set conversations
  setConversationsList: (conversationsList) => {
    set({ conversations: conversationsList });
  },

  // Set messages
  setMessagesList: (participantId, messagesList) => {
    set((state) => ({
      messages: { ...state.messages, [participantId]: messagesList }
    }));
  },

  // Add a message locally
  addMessageLocal: (participantId, message) => {
    set((state) => {
      const existing = state.messages[participantId] || [];
      if (existing.some(m => m._id === message._id)) return {};
      return {
        messages: {
          ...state.messages,
          [participantId]: [...existing, message]
        }
      };
    });
  },

  // Update a message locally (e.g. read receipt, reaction)
  updateMessageLocal: (participantId, messageId, updates) => {
    set((state) => {
      const existing = state.messages[participantId] || [];
      const updated = existing.map(m => m._id === messageId ? { ...m, ...updates } : m);
      return {
        messages: {
          ...state.messages,
          [participantId]: updated
        }
      };
    });
  },

  // 1. Optimistic Like Action (with locks & rollback)
  toggleLikePost: async (postId) => {
    const store = get();
    // 1. Double click/lock prevention
    if (store.locks[`like_${postId}`]) return;
    
    set((state) => ({
      locks: { ...state.locks, [`like_${postId}`]: true }
    }));

    const post = store.posts[postId];
    if (!post) {
      // Release lock if post doesn't exist
      set((state) => ({
        locks: { ...state.locks, [`like_${postId}`]: false }
      }));
      return;
    }

    const originalIsLiked = post.isLiked;
    const originalLikesCount = post.likesCount;
    const nextIsLiked = !originalIsLiked;
    const nextLikesCount = Math.max(0, originalLikesCount + (nextIsLiked ? 1 : -1));

    // Update locally instantly (Optimistic UI)
    store.updatePostLocal(postId, {
      isLiked: nextIsLiked,
      likesCount: nextLikesCount
    });

    try {
      await apiFeed.interact(postId, 'like');
    } catch (e) {
      console.error('Failed to toggle like, rolling back', e);
      // Rollback on failure
      get().updatePostLocal(postId, {
        isLiked: originalIsLiked,
        likesCount: originalLikesCount
      });
    } finally {
      // Debounce lock release for 250ms to prevent instant multi-click
      setTimeout(() => {
        set((state) => ({
          locks: { ...state.locks, [`like_${postId}`]: false }
        }));
      }, 250);
    }
  },

  // 2. Optimistic Save Action (with locks & rollback)
  toggleSavePost: async (postId) => {
    const store = get();
    if (store.locks[`save_${postId}`]) return;

    set((state) => ({
      locks: { ...state.locks, [`save_${postId}`]: true }
    }));

    const post = store.posts[postId];
    if (!post) {
      set((state) => ({
        locks: { ...state.locks, [`save_${postId}`]: false }
      }));
      return;
    }

    const originalIsSaved = post.isSaved;
    const originalSavesCount = post.savesCount || 0;
    const nextIsSaved = !originalIsSaved;
    const nextSavesCount = Math.max(0, originalSavesCount + (nextIsSaved ? 1 : -1));

    // Update locally instantly (Optimistic UI)
    store.updatePostLocal(postId, {
      isSaved: nextIsSaved,
      savesCount: nextSavesCount
    });

    try {
      await apiFeed.interact(postId, 'save');
    } catch (e) {
      console.error('Failed to toggle save, rolling back', e);
      get().updatePostLocal(postId, {
        isSaved: originalIsSaved,
        savesCount: originalSavesCount
      });
    } finally {
      setTimeout(() => {
        set((state) => ({
          locks: { ...state.locks, [`save_${postId}`]: false }
        }));
      }, 250);
    }
  },

  // 3. Optimistic Follow Action (with locks, rollback & global count updates)
  toggleFollowUser: async (userId, currentUserId) => {
    const store = get();
    if (store.locks[`follow_${userId}`]) return;

    set((state) => ({
      locks: { ...state.locks, [`follow_${userId}`]: true }
    }));

    const profile = store.profiles[userId];
    const wasFollowing = profile ? profile.isFollowing : false;
    const originalFollowers = profile ? profile.followersCount : 0;
    const nextIsFollowing = !wasFollowing;
    const nextFollowers = Math.max(0, originalFollowers + (nextIsFollowing ? 1 : -1));

    // Update target profile cache optimistically
    if (profile) {
      store.updateProfileLocal(userId, {
        isFollowing: nextIsFollowing,
        followersCount: nextFollowers
      });
    }

    // Also update this author state inside any of their cached posts
    Object.keys(store.posts).forEach((postId) => {
      const p = store.posts[postId];
      if (p.author && p.author.id === userId) {
        store.updatePostLocal(postId, {
          author: { ...p.author, isFollowing: nextIsFollowing }
        });
      }
    });

    // If we have the current logged-in user profile cached, update their following count!
    if (currentUserId && store.profiles[currentUserId]) {
      const currProfile = store.profiles[currentUserId];
      const origFollowing = currProfile.followingCount || 0;
      store.updateProfileLocal(currentUserId, {
        followingCount: Math.max(0, origFollowing + (nextIsFollowing ? 1 : -1))
      });
    }

    try {
      await apiUsers.toggleFollow(userId);
    } catch (e) {
      console.error('Failed to toggle follow, rolling back', e);
      // Rollback
      if (profile) {
        get().updateProfileLocal(userId, {
          isFollowing: wasFollowing,
          followersCount: originalFollowers
        });
      }

      Object.keys(get().posts).forEach((postId) => {
        const p = get().posts[postId];
        if (p.author && p.author.id === userId) {
          get().updatePostLocal(postId, {
            author: { ...p.author, isFollowing: wasFollowing }
          });
        }
      });

      if (currentUserId && get().profiles[currentUserId]) {
        const currProfile = get().profiles[currentUserId];
        const origFollowing = currProfile.followingCount || 0;
        get().updateProfileLocal(currentUserId, {
          followingCount: Math.max(0, origFollowing + (wasFollowing ? 1 : -1))
        });
      }
    } finally {
      setTimeout(() => {
        set((state) => ({
          locks: { ...state.locks, [`follow_${userId}`]: false }
        }));
      }, 250);
    }
  }
}));
