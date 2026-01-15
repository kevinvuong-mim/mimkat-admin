interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  deviceName: string;
  deviceType: string;
  isCurrent: boolean;
  lastUsedAt: string;
}

export type { Session };
