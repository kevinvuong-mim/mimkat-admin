interface User {
  id: string;
  avatar?: string;
  createdAt: string;
  fullName?: string;
  username?: string;
}

interface CurrentUser extends User {
  email: string;
  isActive: boolean;
  updatedAt: string;
  hasPassword: boolean;
  phoneNumber?: string;
  hasGoogleAuth: boolean;
  isEmailVerified: boolean;
}

interface CurrentUserState {
  currentUser: undefined | CurrentUser;
}

export type { User, CurrentUser, CurrentUserState };
