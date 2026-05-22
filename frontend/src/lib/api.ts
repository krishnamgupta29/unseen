/**
 * Frontend API service layer
 * BASE already includes /api (from .env.local)
 */

const isBrowser = typeof window !== 'undefined';
const BASE = isBrowser 
  ? `http://${window.location.hostname}:5001/api` 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');

// ─── Token management ──────────────────────────────────────────────────────
let accessToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

export function setAccessToken(token: string) {
  accessToken = token;
  if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
}

export function clearAccessToken() {
  accessToken = null;
  if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── Base fetch wrapper ────────────────────────────────────────────────────
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const data = await res.clone().json().catch(() => ({}));
    if (data.code === 'TOKEN_EXPIRED') {
      const refreshed = await refreshAccessToken();
      if (refreshed) return apiFetch<T>(endpoint, options);
    }
    clearAccessToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('unauthorized'));
    }
    throw new Error(data.message || 'Unauthorized');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Refresh access token ──────────────────────────────────────────────────
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) { clearAccessToken(); return false; }
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    clearAccessToken();
    return false;
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  signup: (displayName: string, password: string, email?: string) =>
    apiFetch<{ accessToken: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ displayName, password, email }),
    }),

  login: (username: string, password: string) =>
    apiFetch<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch<any>('/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  forgotPassword: (email: string, displayName?: string, secureOtp?: string) =>
    apiFetch<{ message: string; otp?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, secureOtp }),
    }),

  resetPassword: (email: string, otp: string, resetPassword: string) =>
    apiFetch<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword: resetPassword }),
    }),

  // Email management
  sendEmailOtp: (email: string) =>
    apiFetch<{ message: string; otp?: string }>('/auth/email/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyAndLinkEmail: (email: string, otp: string) =>
    apiFetch<{ message: string; user: any }>('/auth/email/verify-link', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  removeEmail: (password: string) =>
    apiFetch<{ message: string; user: any }>('/auth/email/remove', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};

// ─── Feed ──────────────────────────────────────────────────────────────────
export type FeedMode = 'for_you' | 'following' | 'trending' | 'late_night' | 'rising';

export const feed = {
  get: (mode: FeedMode = 'for_you', page = 1) =>
    apiFetch<{ posts: any[]; page: number; hasMore: boolean; mode: string }>(
      `/feed?mode=${mode}&page=${page}`
    ),

  createPost: (content: string, moodTag?: string) =>
    apiFetch<any>('/feed/posts', {
      method: 'POST',
      body: JSON.stringify({ content, moodTag }),
    }),

  interact: (postId: string, interactionType: string, readDurationMs?: number) =>
    apiFetch<any>('/feed/interact', {
      method: 'POST',
      body: JSON.stringify({ postId, interactionType, readDurationMs }),
    }),

  getTrendingTags: () =>
    apiFetch<{ tag: string; count: number }[]>('/feed/trending-tags'),

  getNetworkStats: () =>
    apiFetch<{ totalUsers: number; totalPosts: number; activeUsers?: number }>('/feed/stats'),

  getPostById: (id: string) =>
    apiFetch<any>(`/feed/posts/${id}`),
  deletePost: (id: string) => apiFetch<any>(`/feed/posts/${id}`, { method: 'DELETE' }),
  };

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = {
  getProfile: (id: string) => apiFetch<any>(`/users/${id}`),
  updateProfile: (data: { displayName?: string; bio?: string }) => apiFetch<any>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getPosts: (id: string, page = 1) => apiFetch<{ posts: any[]; hasMore: boolean }>(`/users/${id}/posts?page=${page}`),
  getSavedPosts: (id: string) => apiFetch<{ posts: any[] }>(`/users/${id}/saved`),
  toggleFollow: (id: string) => apiFetch<{ message: string; isFollowing: boolean }>(`/users/${id}/follow`, { method: 'POST' }),
  getFollowers: (id: string) => apiFetch<any[]>(`/users/${id}/followers`),
  getFollowing: (id: string) => apiFetch<any[]>(`/users/${id}/following`),
  search: (q: string) => apiFetch<any[]>(`/users/search?q=${encodeURIComponent(q)}`),
  report: (id: string, data: { reason: string; contentId?: string; contentType?: string }) => apiFetch<{ message: string }>(`/users/${id}/report`, { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Messages ──────────────────────────────────────────────────────────────
export const messages = {
  getConversations: () => apiFetch<any[]>('/messages/conversations'),
  getMessages: (userId: string) => apiFetch<any[]>(`/messages/${userId}`),
  send: (userId: string, content: string) =>
    apiFetch<any>(`/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  delete: (messageId: string) =>
    apiFetch<any>(`/messages/${messageId}`, { method: 'DELETE' }),
  deleteConversation: (conversationId: string) =>
    apiFetch<any>(`/messages/chat/${conversationId}`, { method: 'DELETE' }),
  react: (messageId: string, emoji: string) =>
    apiFetch<{ messageId: string; reactions: { userId: string; emoji: string }[] }>(`/messages/${messageId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
};

// ─── Comments ────────────────────────────────────────────────────────────────
export const comments = {
  get: (postId: string) => apiFetch<any[]>(`/comments/${postId}`),
  create: (postId: string, content: string, parentComment?: string) => 
    apiFetch<any>(`/comments/${postId}`, { method: 'POST', body: JSON.stringify({ content, parentComment }) }),
  like: (commentId: string) => apiFetch<{ message: string; isLiked: boolean }>(`/comments/${commentId}/like`, { method: 'POST' }),
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const notifications = {
  list: () => apiFetch<any[]>('/notifications'),
  markAllRead: () => apiFetch<any>('/notifications/mark-all-read', { method: 'POST' })
};

// ─── Admin ─────────────────────────────────────────────────────────────────
export const admin = {
  getStats: () => apiFetch<any>('/admin/stats'),
  getFlaggedPosts: () => apiFetch<any[]>('/admin/flagged-posts'),
  removePost: (id: string) => apiFetch<any>(`/admin/posts/${id}/remove`, { method: 'POST' }),
  clearPost: (id: string) => apiFetch<any>(`/admin/posts/${id}/clear`, { method: 'POST' }),
  suspendUser: (id: string, reason: string) =>
    apiFetch<any>(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unsuspendUser: (id: string) =>
    apiFetch<any>(`/admin/users/${id}/unsuspend`, { method: 'POST' }),
  getAbuseLogs: (params?: { severity?: string; resolved?: boolean }) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/admin/abuse-logs${q ? `?${q}` : ''}`);
  },
  getUsers: (page = 1, search?: string) => {
    const q = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) }).toString();
    return apiFetch<any>(`/admin/users?${q}`);
  },
};
