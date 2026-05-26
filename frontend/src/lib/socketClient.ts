import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  const rawUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5001';
  return rawUrl.replace(/\/api$/, '').replace(/\/$/, '');
};

export const getSocket = (): Socket => {
  if (socket && socket.connected) return socket;

  // Always read the latest token so reconnects after refresh work
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!socket) {
    socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      randomizationFactor: 0.4,
      timeout: 10000,
    });

    // On reconnect attempt, refresh the auth token in case it was rotated
    socket.on('reconnect_attempt', () => {
      const freshToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;
      if (socket) {
        (socket.auth as Record<string, string>).token = freshToken || '';
      }
    });
  } else if (!socket.connected) {
    // Update token before reconnect if disconnected
    if (socket.auth && token) {
      (socket.auth as Record<string, string>).token = token;
    }
    socket.connect();
  }

  return socket;
};

/** Call this after a token rotation so the socket re-authenticates immediately */
export const reconnectSocket = () => {
  if (socket) {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    if (socket.auth) {
      (socket.auth as Record<string, string>).token = token || '';
    }
    socket.disconnect().connect();
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

