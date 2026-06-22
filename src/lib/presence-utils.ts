export function formatLastSeen(lastSeenAt: string | null | undefined): string | null {
  if (!lastSeenAt) return null;

  const date = new Date(lastSeenAt);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function getPresenceLabel(isOnline: boolean, lastSeenAt: string | null | undefined): string {
  if (isOnline) return 'Online';

  const lastSeen = formatLastSeen(lastSeenAt);
  return lastSeen ? `Last seen ${lastSeen}` : 'Offline';
}
