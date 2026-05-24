'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
const SOCKET_URL = rawUrl.replace(/\/api$/, '').replace(/\/$/, '');

let socket: Socket | null = null;

export function getSocket(accessToken: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

interface UseSocketOptions {
  accessToken: string | null;
  onMessage?: (data: any) => void;
  onTypingStart?: (data: { userId: string }) => void;
  onTypingStop?: (data: { userId: string }) => void;
  onRead?: (data: { readBy: string }) => void;
  onReaction?: (data: any) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
}

export function useSocket({
  accessToken,
  onMessage,
  onTypingStart,
  onTypingStop,
  onRead,
  onReaction,
  onUserOnline,
  onUserOffline,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const s = getSocket(accessToken);
    socketRef.current = s;

    if (onMessage) s.on('message:receive', onMessage);
    if (onTypingStart) s.on('typing:start', onTypingStart);
    if (onTypingStop) s.on('typing:stop', onTypingStop);
    if (onRead) s.on('message:read', onRead);
    if (onReaction) s.on('reaction:add', onReaction);
    if (onUserOnline) s.on('user:online', onUserOnline);
    if (onUserOffline) s.on('user:offline', onUserOffline);

    return () => {
      if (onMessage) s.off('message:receive', onMessage);
      if (onTypingStart) s.off('typing:start', onTypingStart);
      if (onTypingStop) s.off('typing:stop', onTypingStop);
      if (onRead) s.off('message:read', onRead);
      if (onReaction) s.off('reaction:add', onReaction);
      if (onUserOnline) s.off('user:online', onUserOnline);
      if (onUserOffline) s.off('user:offline', onUserOffline);
    };
  }, [accessToken]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    socketRef.current?.emit('message:send', { receiverId, content });
  }, []);

  const sendTypingStart = useCallback((receiverId: string) => {
    socketRef.current?.emit('typing:start', { receiverId });
  }, []);

  const sendTypingStop = useCallback((receiverId: string) => {
    socketRef.current?.emit('typing:stop', { receiverId });
  }, []);

  const sendRead = useCallback((senderId: string) => {
    socketRef.current?.emit('message:read', { senderId });
  }, []);

  const sendReaction = useCallback((messageId: string, receiverId: string, emoji: string) => {
    socketRef.current?.emit('reaction:add', { messageId, receiverId, emoji });
  }, []);

  return { sendMessage, sendTypingStart, sendTypingStop, sendRead, sendReaction };
}
