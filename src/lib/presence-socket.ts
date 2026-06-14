import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function createPresenceSocket(): Socket {
  return io(`${API_URL}/presence`, {
    autoConnect: false,
    reconnection: true,
    withCredentials: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });
}

export const PRESENCE_SOCKET_EVENTS = {
  INITIAL: 'presence:initial',
  STATUS_CHANGED: 'presence:status-changed',
} as const;
