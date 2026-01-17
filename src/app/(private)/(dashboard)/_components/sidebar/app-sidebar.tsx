'use client';

import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { Command, ChartBar, LayoutDashboard } from 'lucide-react';

import {
  Sidebar,
  SidebarMenu,
  SidebarFooter,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { sidebarVariant, sidebarCollapsible } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.sidebarVariant,
      sidebarCollapsible: s.sidebarCollapsible,
    })),
  );

  return (
    <Sidebar {...props} variant={sidebarVariant} collapsible={sidebarCollapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link prefetch={false} href="/default">
                <Command />
                <span className="text-base font-semibold">Mimkat Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            {
              id: 1,
              label: 'Dashboards',
              items: [
                {
                  url: '/default',
                  title: 'Default',
                  icon: LayoutDashboard,
                },
                {
                  url: '/crm',
                  title: 'CRM',
                  icon: ChartBar,
                },
              ],
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
