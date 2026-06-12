interface User {
  id: string;
  email: string;
  avatar?: string;
  createdAt: string;
  fullName?: string;
  username?: string;
}

interface CurrentUser {
  id: string;
  email: string;
  avatar?: string;
  createdAt: string;
  fullName?: string;
  isActive: boolean;
  updatedAt: string;
  username?: string;
  hasPassword: boolean;
  phoneNumber?: string;
  hasGoogleAuth: boolean;
  isEmailVerified: boolean;
}

interface CurrentUserState {
  currentUser: undefined | CurrentUser;
}

export type { User, CurrentUser, CurrentUserState };
