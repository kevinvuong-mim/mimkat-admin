import { createStore } from 'zustand/vanilla';

import {
  NavbarStyle,
  ContentLayout,
  SidebarVariant,
  SidebarCollapsible,
} from '@/lib/preferences/layout';
import { FontKey } from '@/lib/fonts/registry';
import { PREFERENCE_DEFAULTS } from '@/lib/preferences/preferences-config';
import { ThemeMode, ThemePreset, ResolvedThemeMode } from '@/lib/preferences/theme';

export type PreferencesState = {
  font: FontKey;
  isSynced: boolean;
  themeMode: ThemeMode;
  navbarStyle: NavbarStyle;
  themePreset: ThemePreset;
  contentLayout: ContentLayout;
  sidebarVariant: SidebarVariant;
  setFont: (font: FontKey) => void;
  setIsSynced: (val: boolean) => void;
  resolvedThemeMode: ResolvedThemeMode;
  sidebarCollapsible: SidebarCollapsible;
  setThemeMode: (mode: ThemeMode) => void;
  setNavbarStyle: (style: NavbarStyle) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setContentLayout: (layout: ContentLayout) => void;
  setSidebarVariant: (variant: SidebarVariant) => void;
  setResolvedThemeMode: (mode: ResolvedThemeMode) => void;
  setSidebarCollapsible: (mode: SidebarCollapsible) => void;
};

export const createPreferencesStore = (init?: Partial<PreferencesState>) =>
  createStore<PreferencesState>()((set) => ({
    setFont: (font) => set({ font }),
    isSynced: init?.isSynced ?? false,
    font: init?.font ?? PREFERENCE_DEFAULTS.font,
    setIsSynced: (val) => set({ isSynced: val }),
    setThemeMode: (mode) => set({ themeMode: mode }),
    resolvedThemeMode: init?.resolvedThemeMode ?? 'light',
    setNavbarStyle: (style) => set({ navbarStyle: style }),
    setThemePreset: (preset) => set({ themePreset: preset }),
    setContentLayout: (layout) => set({ contentLayout: layout }),
    themeMode: init?.themeMode ?? PREFERENCE_DEFAULTS.theme_mode,
    setResolvedThemeMode: (mode) => set({ resolvedThemeMode: mode }),
    setSidebarVariant: (variant) => set({ sidebarVariant: variant }),
    navbarStyle: init?.navbarStyle ?? PREFERENCE_DEFAULTS.navbar_style,
    setSidebarCollapsible: (mode) => set({ sidebarCollapsible: mode }),
    themePreset: init?.themePreset ?? PREFERENCE_DEFAULTS.theme_preset,
    contentLayout: init?.contentLayout ?? PREFERENCE_DEFAULTS.content_layout,
    sidebarVariant: init?.sidebarVariant ?? PREFERENCE_DEFAULTS.sidebar_variant,
    sidebarCollapsible: init?.sidebarCollapsible ?? PREFERENCE_DEFAULTS.sidebar_collapsible,
  }));
