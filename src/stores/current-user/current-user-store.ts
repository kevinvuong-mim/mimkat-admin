import { createStore } from 'zustand/vanilla';

import { CurrentUserState } from '@/types/user';

export const createCurrentUserStore = (init: Partial<CurrentUserState>) =>
  createStore<CurrentUserState>()(() => ({
    currentUser: init.currentUser,
  }));
