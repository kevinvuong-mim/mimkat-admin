export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface PresenceStatusChangedPayload {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface PresenceInitialPayload {
  onlineUserIds: string[];
}

export type GetPresenceResponse = import('./api/api-response').SuccessResponse<UserPresence[]>;
