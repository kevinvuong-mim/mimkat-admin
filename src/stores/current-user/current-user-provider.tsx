'use client';

import { StoreApi, useStore } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { useContext, createContext } from 'react';

import { getMe } from '@/services/users';
import { CurrentUserState } from '@/types';
import { createCurrentUserStore } from './current-user-store';

const CurrentUserStoreContext = createContext<StoreApi<CurrentUserState> | null>(null);

export const CurrentUserStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, data: currentUser } = useQuery({
    queryFn: getMe,
    queryKey: ['getMe'],
  });

  if (isLoading || !currentUser) return null;

  return (
    <CurrentUserStoreContext.Provider value={createCurrentUserStore({ currentUser })}>
      {children}
    </CurrentUserStoreContext.Provider>
  );
};

export const useCurrentUserStore = <T,>(selector: (state: CurrentUserState) => T): T => {
  const store = useContext(CurrentUserStoreContext);
  if (!store) throw new Error('Missing CurrentUserStoreProvider');
  return useStore(store, selector);
};
