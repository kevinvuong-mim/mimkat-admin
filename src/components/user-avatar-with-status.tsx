'use client';

import { cn } from '@/lib/utils';
import { usePresence } from '@/providers/presence-provider';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface UserAvatarWithStatusProps {
  userId?: string;
  fallback: string;
  className?: string;
  src?: string | null;
  showStatus?: boolean;
}

export function UserAvatarWithStatus({
  userId,
  src,
  fallback,
  className,
  showStatus = true,
}: UserAvatarWithStatusProps) {
  const { isOnline } = usePresence();
  const online = userId ? isOnline(userId) : false;

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar className={className}>
        <AvatarImage src={src ?? undefined} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showStatus && userId && (
        <span
          className={cn(
            'border-background absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2',
            online ? 'bg-green-500' : 'bg-muted-foreground/40',
          )}
          aria-hidden
        />
      )}
    </div>
  );
}
