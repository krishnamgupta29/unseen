// Mock data removed. App now uses MongoDB.

import { Profile, Post, Conversation, Notification, Comment } from './types';

export const initialComments: Record<string, Comment[]> = {};
export const moodTags: string[] = [];
export const profileThemes: any[] = [];
export const profiles: Profile[] = [];
export const posts: Post[] = [];
export const conversations: Conversation[] = [];
export const notifications: Notification[] = [];
export const currentUser: Profile = {
  id: '',
  username: '',
  displayName: '',
  bio: '',
  avatarGradient: '',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  highlights: [],
};

export const getProfile = (id: string) => undefined;
export const getPostsByProfile = (profileId: string) => [];
export const getConversation = (id: string) => undefined;
