import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { Toaster } from '@/components/ui/sonner';
import { fontVars } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { ThemeBootScript } from '@/scripts/theme-boot';
import { QueryProvider } from '@/providers/query-provider';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Mimkat Admin',
  icons: { icon: '/images/logo.png' },
  description:
    'Mimkat Admin is a modern, open-source dashboard starter template built with Next.js 16, Tailwind CSS v4, and shadcn/ui. Perfect for SaaS apps, admin panels, and internal tools—fully customizable and production-ready.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const {
    theme_mode,
    theme_preset,
    content_layout,
    navbar_style,
    sidebar_variant,
    sidebar_collapsible,
    font,
  } = PREFERENCE_DEFAULTS;
  return (
    <html
      lang="en"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <PreferencesStoreProvider
          themeMode={theme_mode}
          themePreset={theme_preset}
          contentLayout={content_layout}
          navbarStyle={navbar_style}
          font={font}
        >
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-center" />
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}
