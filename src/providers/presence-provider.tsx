'use client';

import type { Socket } from 'socket.io-client';
import {
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';

import type {
  UserPresence,
  PresenceInitialPayload,
  PresenceStatusChangedPayload,
} from '@/types/presence';
import { getPresence } from '@/services/presence';
import { getPresenceLabel } from '@/lib/presence-utils';
import { useCurrentUserStore } from '@/stores/current-user/current-user-provider';
import { createPresenceSocket, PRESENCE_SOCKET_EVENTS } from '@/lib/presence-socket';

interface PresenceContextValue {
  isOnline: (userId: string) => boolean;
  getPresenceLabel: (userId: string) => string;
  fetchPresence: (userIds: string[]) => Promise<void>;
  getPresence: (userId: string) => UserPresence | undefined;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: ReactNode }) {
  const currentUserId = useCurrentUserStore((state) => state.currentUser?.id);

  const socketRef = useRef<Socket | null>(null);
  const listenersBoundRef = useRef(false);
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceMapRef = useRef<Map<string, UserPresence>>(new Map());
  const fetchInFlightRef = useRef<Set<string>>(new Set());

  const [, forceUpdate] = useState(0);
  const bump = useCallback(() => forceUpdate((value) => value + 1), []);

  const setPresence = useCallback(
    (userId: string, data: Omit<UserPresence, 'userId'>) => {
      presenceMapRef.current.set(userId, { userId, ...data });
      bump();
    },
    [bump],
  );

  const isOnline = useCallback((userId: string) => {
    return presenceMapRef.current.get(userId)?.isOnline ?? false;
  }, []);

  const getPresenceState = useCallback((userId: string) => {
    return presenceMapRef.current.get(userId);
  }, []);

  const getPresenceLabelForUser = useCallback((userId: string) => {
    const presence = presenceMapRef.current.get(userId);
    return getPresenceLabel(presence?.isOnline ?? false, presence?.lastSeenAt);
  }, []);

  const fetchPresence = useCallback(
    async (userIds: string[]) => {
      const missing = userIds.filter(
        (userId) => userId && userId !== currentUserId && !presenceMapRef.current.has(userId),
      );

      if (!missing.length) return;

      const requestKey = missing.sort().join(',');
      if (fetchInFlightRef.current.has(requestKey)) return;

      fetchInFlightRef.current.add(requestKey);

      try {
        const items = await getPresence(missing);
        for (const item of items) {
          setPresence(item.userId, {
            isOnline: item.isOnline,
            lastSeenAt: item.lastSeenAt,
          });
        }
      } finally {
        fetchInFlightRef.current.delete(requestKey);
      }
    },
    [currentUserId, setPresence],
  );

  const connect = useCallback(() => {
    if (!currentUserId) return;

    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }

    if (!socketRef.current) {
      socketRef.current = createPresenceSocket();
      listenersBoundRef.current = false;
    }

    const socket = socketRef.current;

    if (listenersBoundRef.current) {
      if (!socket.connected) socket.connect();
      return;
    }

    listenersBoundRef.current = true;

    socket.on(PRESENCE_SOCKET_EVENTS.INITIAL, ({ onlineUserIds }: PresenceInitialPayload) => {
      for (const userId of onlineUserIds) {
        setPresence(userId, { isOnline: true, lastSeenAt: null });
      }
    });

    socket.on(PRESENCE_SOCKET_EVENTS.STATUS_CHANGED, (payload: PresenceStatusChangedPayload) => {
      setPresence(payload.userId, {
        isOnline: payload.isOnline,
        lastSeenAt: payload.lastSeenAt,
      });
    });

    if (!socket.connected) socket.connect();
  }, [currentUserId, setPresence]);

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
  }, []);

  useEffect(() => {
    if (currentUserId) {
      connect();
    } else {
      disconnect();
      presenceMapRef.current.clear();
      bump();
    }

    return () => {
      disconnectTimeoutRef.current = setTimeout(() => {
        disconnectTimeoutRef.current = null;
        disconnect();
      }, 0);
    };
  }, [currentUserId, connect, disconnect, bump]);

  const value = useMemo(
    () => ({
      isOnline,
      fetchPresence,
      getPresence: getPresenceState,
      getPresenceLabel: getPresenceLabelForUser,
    }),
    [isOnline, fetchPresence, getPresenceState, getPresenceLabelForUser],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  const context = useContext(PresenceContext);

  if (!context) {
    throw new Error('usePresence must be used within PresenceProvider');
  }

  return context;
}
