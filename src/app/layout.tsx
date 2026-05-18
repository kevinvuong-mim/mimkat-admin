import { Metadata } from 'next';
import { ReactNode } from 'react';

import './globals.css';
import { I18nProvider } from '@/context/i18n';
import { fontVars } from '@/lib/fonts/registry';
import { Toaster } from '@/components/ui/sonner';
import { ThemeBootScript } from '@/scripts/theme-boot';
import { QueryProvider } from '@/providers/query-provider';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { PreferencesStoreProvider } from '@/stores/preferences/preferences-provider';

export const metadata: Metadata = {
  title: 'Mimkat Admin',
  icons: { icon: '/images/logo.png' },
  description:
    'Mimkat Admin is a modern, open-source dashboard starter template built with Next.js 16, Tailwind CSS v4, and shadcn/ui.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const {
    font,
    theme_mode,
    navbar_style,
    theme_preset,
    content_layout,
    sidebar_variant,
    sidebar_collapsible,
  } = PREFERENCE_DEFAULTS;

  return (
    <html
      lang="en"
      data-font={font}
      suppressHydrationWarning
      data-theme-mode={theme_mode}
      data-navbar-style={navbar_style}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <PreferencesStoreProvider
          font={font}
          themeMode={theme_mode}
          navbarStyle={navbar_style}
          themePreset={theme_preset}
          contentLayout={content_layout}
        >
          <QueryProvider>
            <I18nProvider>{children}</I18nProvider>
          </QueryProvider>
          <Toaster position="top-center" />
        </PreferencesStoreProvider>
      </body>
    </html>
  );
}
