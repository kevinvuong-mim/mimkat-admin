'use client';

import { createContext, useContext } from 'react';

import { useQuery } from '@tanstack/react-query';
import { type StoreApi, useStore } from 'zustand';

import { getMe } from '@/services/users';
import { createCurrentUserStore, type CurrentUserState } from './current-user-store';

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
