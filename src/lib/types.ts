export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarGradient: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  highlights: string[];
  isFollowing?: boolean;
  moodTag?: string;
}

export interface Post {
  id: string;
  profileId: string;
  type: 'text' | 'voice';
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  waveform?: number[];
  duration?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type?: 'text' | 'voice';
  waveform?: number[];
  duration?: string;
}

export interface Conversation {
  id: string;
  profileId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: 'reaction' | 'message' | 'reply' | 'follow';
  content: string;
  timestamp: string;
  read: boolean;
  profileId: string;
  postId?: string;
  conversationId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  parentId?: string;
}
