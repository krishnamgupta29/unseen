import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const isProd = process.env.NODE_ENV === 'production';
    socket = io(isProd ? 'https://unseen-s9h8.onrender.com' : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001'), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
