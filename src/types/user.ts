interface CurrentUser {
  id: string;
  email: string;
  avatar?: string;
  createdAt: string;
  fullName?: string;
  isActive: boolean;
  updatedAt: string;
  username?: string;
  isOnline?: boolean;
  hasPassword: boolean;
  phoneNumber?: string;
  hasGoogleAuth: boolean;
  isEmailVerified: boolean;
  lastSeenAt?: string | null;
}

interface CurrentUserState {
  currentUser: undefined | CurrentUser;
}

export type { CurrentUser, CurrentUserState };
