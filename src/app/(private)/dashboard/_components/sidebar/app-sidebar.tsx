'use client';

import Link from 'next/link';

import { Command, ChartBar, LayoutDashboard } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

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
              <Link prefetch={false} href="/dashboard/default">
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
                  title: 'Default',
                  icon: LayoutDashboard,
                  url: '/dashboard/default',
                },
                {
                  title: 'CRM',
                  icon: ChartBar,
                  url: '/dashboard/crm',
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
