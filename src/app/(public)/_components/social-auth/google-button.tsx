'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const handleGoogleLogin = () => {
    const currentOrigin = window.location.origin;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const href = `${apiUrl}/auth/google?redirect_url=${encodeURIComponent(currentOrigin)}`;

    window.location.href = href;
  };

  return (
    <Button variant="secondary" className={cn(className)} onClick={handleGoogleLogin} {...props}>
      Continue with Google
    </Button>
  );
}
