'use client';

import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect, useCallback } from 'react';

import { chatQueryKeys } from '@/lib/chat-query-keys';
import type { ChatMessage, Conversation } from '@/types/api/chat';
import { createChatSocket, CHAT_SOCKET_EVENTS } from '@/lib/chat-socket';

interface UseChatOptions {
  enabled?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const listenersBoundRef = useRef(false);
  const sendInFlightRef = useRef<Set<string>>(new Set());
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  const [isConnected, setIsConnected] = useState(false);

  const upsertMessageInCache = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData<{ items: ChatMessage[]; nextCursor: string | null }>(
        chatQueryKeys.messages(message.conversationId),
        (old) => {
          if (!old) return old;
          const exists = old.items.some((m) => m.id === message.id);
          if (exists) return old;
          return {
            ...old,
            items: [message, ...old.items],
          };
        },
      );

      queryClient.setQueryData<Conversation[]>(chatQueryKeys.conversations(), (old) => {
        if (!old) return old;
        return old
          .map((conversation) => {
            if (conversation.id !== message.conversationId) return conversation;
            return {
              ...conversation,
              updatedAt: message.createdAt,
              lastMessage: {
                id: message.id,
                content: message.content,
                type: message.type,
                createdAt: message.createdAt,
                sender: message.sender,
              },
            };
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    },
    [queryClient],
  );

  const connect = useCallback(() => {
    if (!enabled) return;

    if (!socketRef.current) {
      socketRef.current = createChatSocket();
      listenersBoundRef.current = false;
    }

    const socket = socketRef.current;

    if (listenersBoundRef.current) {
      if (!socket.connected) socket.connect();
      return;
    }

    listenersBoundRef.current = true;

    socket.on('connect', () => {
      setIsConnected(true);
      for (const conversationId of joinedConversationsRef.current) {
        socket.emit(CHAT_SOCKET_EVENTS.JOIN, { conversationId });
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on(CHAT_SOCKET_EVENTS.NEW_MESSAGE, (message: ChatMessage) => {
      upsertMessageInCache(message);
    });

    socket.on(CHAT_SOCKET_EVENTS.CONVERSATION_UPDATED, (conversation: Conversation) => {
      queryClient.setQueryData(chatQueryKeys.conversation(conversation.id), conversation);
      queryClient.setQueryData<Conversation[]>(chatQueryKeys.conversations(), (old) => {
        if (!old) return [conversation];
        const index = old.findIndex((c) => c.id === conversation.id);
        if (index === -1) return [conversation, ...old];
        const next = [...old];
        next[index] = conversation;
        return next.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });
    });

    if (!socket.connected) socket.connect();
  }, [enabled, queryClient, upsertMessageInCache]);

  const disconnect = useCallback(() => {
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
    listenersBoundRef.current = false;
    sendInFlightRef.current.clear();
    joinedConversationsRef.current.clear();
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => disconnect();
  }, [enabled, connect, disconnect]);

  const joinConversation = useCallback((conversationId: string) => {
    joinedConversationsRef.current.add(conversationId);
    socketRef.current?.emit(CHAT_SOCKET_EVENTS.JOIN, { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    joinedConversationsRef.current.delete(conversationId);
    socketRef.current?.emit(CHAT_SOCKET_EVENTS.LEAVE, { conversationId });
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        throw new Error('Chat socket is not connected');
      }

      const sendKey = `${conversationId}:${content}`;
      if (sendInFlightRef.current.has(sendKey)) {
        return Promise.reject(new Error('Message is already being sent'));
      }
      sendInFlightRef.current.add(sendKey);

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        content,
        type: 'TEXT',
        conversationId,
        senderId: 'me',
        id: optimisticId,
        sender: {
          id: 'me',
          email: '',
          avatar: null,
          username: null,
          fullName: 'You',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<{ items: ChatMessage[]; nextCursor: string | null }>(
        chatQueryKeys.messages(conversationId),
        (old) => ({
          items: [optimisticMessage, ...(old?.items ?? [])],
          nextCursor: old?.nextCursor ?? null,
        }),
      );

      return new Promise<ChatMessage>((resolve, reject) => {
        const finish = () => sendInFlightRef.current.delete(sendKey);

        socket.emit(
          CHAT_SOCKET_EVENTS.SEND,
          { conversationId, content },
          (response: { success: boolean; message?: ChatMessage; error?: string }) => {
            finish();

            if (!response?.success || !response.message) {
              queryClient.invalidateQueries({ queryKey: chatQueryKeys.messages(conversationId) });
              reject(new Error(response?.error ?? 'Failed to send message'));
              return;
            }

            queryClient.setQueryData<{ items: ChatMessage[]; nextCursor: string | null }>(
              chatQueryKeys.messages(conversationId),
              (old) => {
                if (!old) return { items: [response.message!], nextCursor: null };

                const withoutOptimistic = old.items.filter((m) => m.id !== optimisticId);
                const alreadyExists = withoutOptimistic.some((m) => m.id === response.message!.id);
                if (alreadyExists) {
                  return { ...old, items: withoutOptimistic, nextCursor: old.nextCursor };
                }

                return {
                  ...old,
                  items: [response.message!, ...withoutOptimistic],
                  nextCursor: old.nextCursor,
                };
              },
            );

            resolve(response.message);
          },
        );
      });
    },
    [queryClient],
  );

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    joinConversation,
    leaveConversation,
    socket: socketRef.current,
  };
}
