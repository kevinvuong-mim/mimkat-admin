import { createStore } from 'zustand/vanilla';

import type { CurrentUser } from '@/types/user';

export type CurrentUserState = {
  currentUser: CurrentUser | undefined;
};

export const createCurrentUserStore = (init: Partial<CurrentUserState>) =>
  createStore<CurrentUserState>()(() => ({
    currentUser: init.currentUser,
  }));
