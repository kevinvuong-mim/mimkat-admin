import { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { cn } from '@/lib/utils';
import { PresenceProvider } from '@/providers/presence-provider';
import { LayoutControls } from './(dashboard)/_components/sidebar/layout-controls';
import { CurrentUserStoreProvider } from '@/stores/current-user/current-user-provider';
import { SidebarInset, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/(private)/(dashboard)/_components/sidebar/app-sidebar';

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <CurrentUserStoreProvider>
      <PresenceProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset
            className={cn(
              '[html[data-content-layout=centered]_&]:mx-auto! [html[data-content-layout=centered]_&]:max-w-screen-2xl!',
              // Adds right margin for inset sidebar in centered layout up to 113rem.
              // On wider screens with collapsed sidebar, removes margin and sets margin auto for alignment.
              'max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!',
            )}
          >
            <header
              className={cn(
                'flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
                // Handle sticky navbar style with conditional classes so blur, background, z-index, and rounded corners remain consistent across all SidebarVariant layouts.
                '[html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:backdrop-blur-md',
              )}
            >
              <div className="flex w-full items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SidebarTrigger className="-ml-1" />
                </div>
                <div className="flex items-center gap-2">
                  <LayoutControls />
                </div>
              </div>
            </header>
            <div className="h-full p-4 md:p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </PresenceProvider>
    </CurrentUserStoreProvider>
  );
}
