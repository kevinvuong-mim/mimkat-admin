'use client';

import type { Socket } from 'socket.io-client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { chatQueryKeys } from '@/lib/chat-query-keys';
import { createChatSocket, CHAT_SOCKET_EVENTS } from '@/lib/chat-socket';
import type { ChatMessage, Conversation, ConversationsPage, MessagesPage } from '@/types/api/chat';

interface UseChatOptions {
  enabled?: boolean;
  currentUserId?: string;
  onConversationDeleted?: (conversationId: string) => void;
}

function moveConversationToTop(
  pages: ConversationsPage[],
  conversation: Conversation,
): ConversationsPage[] {
  const filtered = pages.map((page) => ({
    ...page,
    items: page.items.filter((item) => item.id !== conversation.id),
  }));

  if (!filtered.length) {
    return [{ items: [conversation], nextCursor: null }];
  }

  return filtered.map((page, index) =>
    index === 0 ? { ...page, items: [conversation, ...page.items] } : page,
  );
}

export function useChat(options: UseChatOptions = {}) {
  const { enabled = true, currentUserId, onConversationDeleted } = options;
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const listenersBoundRef = useRef(false);
  const sendInFlightRef = useRef<Set<string>>(new Set());
  const joinedConversationsRef = useRef<Set<string>>(new Set());
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onConversationDeletedRef = useRef(onConversationDeleted);

  onConversationDeletedRef.current = onConversationDeleted;

  const [isConnected, setIsConnected] = useState(false);

  const upsertMessageInCache = useCallback(
    (message: ChatMessage) => {
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        chatQueryKeys.messages(message.conversationId),
        (old) => {
          const pages = old?.pages ?? [{ items: [], nextCursor: null }];
          const pageParams = old?.pageParams ?? [undefined];
          const firstPage = pages[0] ?? { items: [], nextCursor: null };

          if (firstPage.items.some((item) => item.id === message.id)) {
            return old ?? { pages, pageParams };
          }

          return {
            pageParams,
            pages: [{ ...firstPage, items: [message, ...firstPage.items] }, ...pages.slice(1)],
          };
        },
      );

      queryClient.setQueryData<InfiniteData<ConversationsPage>>(
        chatQueryKeys.conversations(),
        (old) => {
          if (!old) return old;

          let updatedConversation: Conversation | null = null;
          const pages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((conversation) => {
              if (conversation.id !== message.conversationId) return conversation;

              updatedConversation = {
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
              return updatedConversation;
            }),
          }));

          if (!updatedConversation) return old;

          return {
            ...old,
            pages: moveConversationToTop(pages, updatedConversation),
          };
        },
      );
    },
    [queryClient],
  );

  const connect = useCallback(() => {
    if (!enabled) return;

    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }

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
      queryClient.setQueryData<InfiniteData<ConversationsPage>>(
        chatQueryKeys.conversations(),
        (old) => {
          if (!old) {
            return {
              pageParams: [undefined],
              pages: [{ items: [conversation], nextCursor: null }],
            };
          }

          return {
            ...old,
            pages: moveConversationToTop(
              old.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== conversation.id),
              })),
              conversation,
            ),
          };
        },
      );
    });

    socket.on(
      CHAT_SOCKET_EVENTS.CONVERSATION_DELETED,
      ({ conversationId }: { conversationId: string }) => {
        queryClient.setQueryData<InfiniteData<ConversationsPage>>(
          chatQueryKeys.conversations(),
          (old) => {
            if (!old) return old;

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.filter((item) => item.id !== conversationId),
              })),
            };
          },
        );

        queryClient.removeQueries({ queryKey: chatQueryKeys.messages(conversationId) });
        onConversationDeletedRef.current?.(conversationId);
      },
    );

    if (!socket.connected) socket.connect();
  }, [enabled, queryClient, upsertMessageInCache]);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.removeAllListeners();

    if (socket.connected) {
      socket.disconnect();
    } else {
      socket.close();
    }

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

    return () => {
      disconnectTimeoutRef.current = setTimeout(() => {
        disconnectTimeoutRef.current = null;
        disconnect();
      }, 0);
    };
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

      if (!currentUserId) {
        throw new Error('Current user is not available');
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
        senderId: currentUserId,
        id: optimisticId,
        sender: {
          id: currentUserId,
          email: '',
          avatar: null,
          username: null,
          fullName: 'You',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        chatQueryKeys.messages(conversationId),
        (old) => {
          const pages = old?.pages ?? [{ items: [], nextCursor: null }];
          const pageParams = old?.pageParams ?? [undefined];
          const firstPage = pages[0] ?? { items: [], nextCursor: null };

          return {
            pageParams,
            pages: [
              { ...firstPage, items: [optimisticMessage, ...firstPage.items] },
              ...pages.slice(1),
            ],
          };
        },
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

            queryClient.setQueryData<InfiniteData<MessagesPage>>(
              chatQueryKeys.messages(conversationId),
              (old) => {
                const pages = old?.pages ?? [{ items: [], nextCursor: null }];
                const pageParams = old?.pageParams ?? [undefined];
                const firstPage = pages[0] ?? { items: [], nextCursor: null };
                const withoutOptimistic = firstPage.items.filter(
                  (item) => item.id !== optimisticId,
                );
                const alreadyExists = withoutOptimistic.some(
                  (item) => item.id === response.message!.id,
                );

                const nextFirstPage = alreadyExists
                  ? { ...firstPage, items: withoutOptimistic }
                  : { ...firstPage, items: [response.message!, ...withoutOptimistic] };

                return {
                  pageParams,
                  pages: [nextFirstPage, ...pages.slice(1)],
                };
              },
            );

            resolve(response.message);
          },
        );
      });
    },
    [currentUserId, queryClient],
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
