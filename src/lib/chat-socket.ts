import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function createChatSocket(): Socket {
  return io(`${API_URL}/chat`, {
    autoConnect: false,
    reconnection: true,
    withCredentials: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });
}

export const CHAT_SOCKET_EVENTS = {
  JOIN: 'chat:join',
  SEND: 'chat:send',
  LEAVE: 'chat:leave',
  NEW_MESSAGE: 'chat:new-message',
  CONVERSATION_UPDATED: 'chat:conversation-updated',
  CONVERSATION_DELETED: 'chat:conversation-deleted',
} as const;
