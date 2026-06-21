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
  isOptimistic?: boolean;
}

export interface Conversation {
  conversationId: string;
  unreadCount: number;
  lastMessage: Message;
  participant: User;
}

// Latest-intent tracking for like/save operations
interface PendingIntent {
  intended: boolean; // The latest desired state (liked/saved or not)
  inFlight: boolean; // Whether an API request is currently in progress
}

interface AppStoreState {
  // Cache storage
  posts: Record<string, Post>;
  profiles: Record<string, User>;
  feeds: Record<string, string[]>; // feedName -> array of postIds
  conversations: Conversation[];
  messages: Record<string, Message[]>; // participantId -> messages
  activeChatId: string | null;
  
  // Session tracking for cache invalidation on account switch (Issue 3)
  sessionVersion: number;

  // Latest-intent maps for like/save (Issue 1)
  likePendingIntents: Record<string, PendingIntent>;
  savePendingIntents: Record<string, PendingIntent>;

  // Pending locks for follow operations only
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
  markConversationAsReadLocal: (participantId: string) => void;
  prependMessagesLocal: (participantId: string, olderMessages: Message[]) => void;
  setActiveChatId: (id: string | null) => void;

  // Session management (Issue 3)
  incrementSession: () => number;
  clearAllUserState: () => void;

  // Optimistic Operations
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  toggleFollowUser: (userId: string, currentUserId?: string) => Promise<void>;
}

// Show a subtle non-blocking toast (Issue 1)
function showToast(message: string) {
  if (typeof window === 'undefined') return;
  // Create a non-blocking toast element
  const existing = document.getElementById('unseen-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'unseen-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
    background: rgba(15, 5, 37, 0.95); color: #c084fc; padding: 10px 20px;
    border-radius: 12px; font-size: 13px; z-index: 99999;
    border: 1px solid rgba(157, 78, 221, 0.3);
    box-shadow: 0 0 20px rgba(0,0,0,0.5);
    animation: fadeInUp 0.3s ease-out;
    font-family: Inter, sans-serif;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 2500);
  setTimeout(() => toast.remove(), 3000);
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  posts: {},
  profiles: {},
  feeds: {},
  conversations: [],
  messages: {},
  locks: {},
  activeChatId: null,
  sessionVersion: 0,
  likePendingIntents: {},
  savePendingIntents: {},

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

  setActiveChatId: (id) => set({ activeChatId: id }),

  // Add a message locally
  addMessageLocal: (participantId, message) => {
    set((state) => {
      const existing = state.messages[participantId] || [];
      if (existing.some(m => m._id === message._id)) return {};
      
      // If it's a real message (not optimistic), try to replace matching optimistic draft
      if (!message.isOptimistic) {
        const optIdx = existing.findIndex(m => m.isOptimistic && m.content === message.content && m.sender === message.sender);
        if (optIdx > -1) {
          const updated = [...existing];
          updated[optIdx] = message;
          return {
            messages: {
              ...state.messages,
              [participantId]: updated
            }
          };
        }
      }

      return {
        messages: {
          ...state.messages,
          [participantId]: [...existing, message]
        }
      };
    });
  },

  // Mark a conversation as read locally
  markConversationAsReadLocal: (participantId) => {
    set((state) => {
      const updatedConvs = state.conversations.map((c) => {
        if (c.participant._id === participantId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      return { conversations: updatedConvs };
    });
  },

  // Prepend older messages
  prependMessagesLocal: (participantId, olderMessages) => {
    set((state) => {
      const existing = state.messages[participantId] || [];
      const existingIds = new Set(existing.map((m) => m._id));
      const filtered = olderMessages.filter((m) => !existingIds.has(m._id));
      return {
        messages: {
          ...state.messages,
          [participantId]: [...filtered, ...existing],
        },
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

  // ── Session management (Issue 3) ────────────────────────────────────
  incrementSession: () => {
    const next = get().sessionVersion + 1;
    set({ sessionVersion: next });
    return next;
  },

  clearAllUserState: () => {
    set({
      posts: {},
      profiles: {},
      feeds: {},
      conversations: [],
      messages: {},
      locks: {},
      activeChatId: null,
      likePendingIntents: {},
      savePendingIntents: {},
    });
  },

  // ── Optimistic Like with latest-intent queue (Issue 1) ──────────────
  toggleLikePost: (postId) => {
    const store = get();
    const post = store.posts[postId];
    if (!post) return;

    const currentIsLiked = post.isLiked;
    const nextIsLiked = !currentIsLiked;
    const nextLikesCount = Math.max(0, post.likesCount + (nextIsLiked ? 1 : -1));

    // 1. Immediately toggle local state (optimistic)
    store.updatePostLocal(postId, {
      isLiked: nextIsLiked,
      likesCount: nextLikesCount
    });

    // 2. Record the latest intended state
    const currentIntent = store.likePendingIntents[postId];
    const isInFlight = currentIntent?.inFlight || false;

    set((state) => ({
      likePendingIntents: {
        ...state.likePendingIntents,
        [postId]: { intended: nextIsLiked, inFlight: isInFlight }
      }
    }));

    // 3. If an API call is already in flight, just update the intent — the in-flight handler will pick it up
    if (isInFlight) return;

    // 4. Fire the API call
    const sessionAtStart = store.sessionVersion;
    const fireRequest = async () => {
      const s = get();
      const intent = s.likePendingIntents[postId];
      if (!intent || s.sessionVersion !== sessionAtStart) return; // Session changed, abort

      // Mark as in-flight
      set((state) => ({
        likePendingIntents: {
          ...state.likePendingIntents,
          [postId]: { ...intent, inFlight: true }
        }
      }));

      try {
        const result = await apiFeed.interact(postId, 'like');

        // Check if session is still valid
        if (get().sessionVersion !== sessionAtStart) return;

        // Reconcile with server counts if available (Issue 7)
        if (result && typeof result.likesCount === 'number') {
          get().updatePostLocal(postId, { likesCount: Math.max(0, result.likesCount) });
        }
        if (result && typeof result.isLiked === 'boolean') {
          // Only reconcile if no newer intent exists
          const latestIntent = get().likePendingIntents[postId];
          if (latestIntent && latestIntent.intended === intent.intended) {
            get().updatePostLocal(postId, { isLiked: result.isLiked });
          }
        }
      } catch (e) {
        console.error('Failed to toggle like', e);
        // Revert only if the user's latest intent still matches what we tried to send
        const latestIntent = get().likePendingIntents[postId];
        if (latestIntent && latestIntent.intended === intent.intended && get().sessionVersion === sessionAtStart) {
          const currentPost = get().posts[postId];
          if (currentPost) {
            get().updatePostLocal(postId, {
              isLiked: !intent.intended,
              likesCount: Math.max(0, currentPost.likesCount + (intent.intended ? -1 : 1))
            });
          }
          showToast('Could not update. Try again.');
        }
      } finally {
        // Mark as no longer in-flight
        set((state) => ({
          likePendingIntents: {
            ...state.likePendingIntents,
            [postId]: { ...(state.likePendingIntents[postId] || { intended: false }), inFlight: false }
          }
        }));

        // Check if the user toggled again while we were in-flight
        const latestIntent = get().likePendingIntents[postId];
        const currentPost = get().posts[postId];
        if (latestIntent && currentPost && latestIntent.intended !== currentPost.isLiked && get().sessionVersion === sessionAtStart) {
          // Need to send another request for the latest intent — but first update UI
          // The UI is already correct from the optimistic update, so just fire the request
          fireRequest();
        }
      }
    };

    fireRequest();
  },

  // ── Optimistic Save with latest-intent queue (Issue 1) ──────────────
  toggleSavePost: (postId) => {
    const store = get();
    const post = store.posts[postId];
    if (!post) return;

    const currentIsSaved = post.isSaved;
    const nextIsSaved = !currentIsSaved;
    const nextSavesCount = Math.max(0, (post.savesCount || 0) + (nextIsSaved ? 1 : -1));

    // 1. Immediately toggle local state (optimistic)
    store.updatePostLocal(postId, {
      isSaved: nextIsSaved,
      savesCount: nextSavesCount
    });

    // 2. Record the latest intended state
    const currentIntent = store.savePendingIntents[postId];
    const isInFlight = currentIntent?.inFlight || false;

    set((state) => ({
      savePendingIntents: {
        ...state.savePendingIntents,
        [postId]: { intended: nextIsSaved, inFlight: isInFlight }
      }
    }));

    // 3. If an API call is already in flight, just update the intent
    if (isInFlight) return;

    // 4. Fire the API call
    const sessionAtStart = store.sessionVersion;
    const fireRequest = async () => {
      const s = get();
      const intent = s.savePendingIntents[postId];
      if (!intent || s.sessionVersion !== sessionAtStart) return;

      set((state) => ({
        savePendingIntents: {
          ...state.savePendingIntents,
          [postId]: { ...intent, inFlight: true }
        }
      }));

      try {
        const result = await apiFeed.interact(postId, 'save');
        
        if (get().sessionVersion !== sessionAtStart) return;

        // Reconcile with server counts if available (Issue 7)
        if (result && typeof result.savesCount === 'number') {
          get().updatePostLocal(postId, { savesCount: Math.max(0, result.savesCount) });
        }
        if (result && typeof result.isSaved === 'boolean') {
          const latestIntent = get().savePendingIntents[postId];
          if (latestIntent && latestIntent.intended === intent.intended) {
            get().updatePostLocal(postId, { isSaved: result.isSaved });
          }
        }
      } catch (e) {
        console.error('Failed to toggle save', e);
        const latestIntent = get().savePendingIntents[postId];
        if (latestIntent && latestIntent.intended === intent.intended && get().sessionVersion === sessionAtStart) {
          const currentPost = get().posts[postId];
          if (currentPost) {
            get().updatePostLocal(postId, {
              isSaved: !intent.intended,
              savesCount: Math.max(0, (currentPost.savesCount || 0) + (intent.intended ? -1 : 1))
            });
          }
          showToast('Could not update. Try again.');
        }
      } finally {
        set((state) => ({
          savePendingIntents: {
            ...state.savePendingIntents,
            [postId]: { ...(state.savePendingIntents[postId] || { intended: false }), inFlight: false }
          }
        }));

        const latestIntent = get().savePendingIntents[postId];
        const currentPost = get().posts[postId];
        if (latestIntent && currentPost && latestIntent.intended !== currentPost.isSaved && get().sessionVersion === sessionAtStart) {
          fireRequest();
        }
      }
    };

    fireRequest();
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
      showToast('Could not update. Try again.');
    } finally {
      setTimeout(() => {
        set((state) => ({
          locks: { ...state.locks, [`follow_${userId}`]: false }
        }));
      }, 250);
    }
  }
}));
