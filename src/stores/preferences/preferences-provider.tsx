'use client';

import { StoreApi, useStore } from 'zustand';
import { useRef, useState, useEffect, useContext, createContext } from 'react';

import {
  NAVBAR_STYLE_VALUES,
  CONTENT_LAYOUT_VALUES,
  SIDEBAR_VARIANT_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
} from '@/lib/preferences/layout';
import { FontKey, fontRegistry } from '@/lib/fonts/registry';
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from '@/lib/preferences/theme';
import { createPreferencesStore, type PreferencesState } from './preferences-store';
import { applyThemeMode, subscribeToSystemTheme } from '@/lib/preferences/theme-utils';

const PreferencesStoreContext = createContext<StoreApi<PreferencesState> | null>(null);

function getSafeValue<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  if (!raw) return undefined;
  return allowed.includes(raw as T) ? (raw as T) : undefined;
}

function readDomState(): Partial<PreferencesState> {
  const root = document.documentElement;

  const resolvedMode = root.classList.contains('dark') ? 'dark' : 'light';
  const themeModeAttr = getSafeValue(root.getAttribute('data-theme-mode'), THEME_MODE_VALUES);

  return {
    resolvedThemeMode: resolvedMode,
    themeMode: themeModeAttr ?? resolvedMode,
    sidebarCollapsible: getSafeValue(
      root.getAttribute('data-sidebar-collapsible'),
      SIDEBAR_COLLAPSIBLE_VALUES,
    ),
    navbarStyle: getSafeValue(root.getAttribute('data-navbar-style'), NAVBAR_STYLE_VALUES),
    themePreset: getSafeValue(root.getAttribute('data-theme-preset'), THEME_PRESET_VALUES),
    font: getSafeValue(root.getAttribute('data-font'), Object.keys(fontRegistry) as FontKey[]),
    contentLayout: getSafeValue(root.getAttribute('data-content-layout'), CONTENT_LAYOUT_VALUES),
    sidebarVariant: getSafeValue(root.getAttribute('data-sidebar-variant'), SIDEBAR_VARIANT_VALUES),
  };
}

export const PreferencesStoreProvider = ({
  font,
  children,
  themeMode,
  navbarStyle,
  themePreset,
  contentLayout,
}: {
  children: React.ReactNode;
  font: PreferencesState['font'];
  themeMode: PreferencesState['themeMode'];
  navbarStyle: PreferencesState['navbarStyle'];
  themePreset: PreferencesState['themePreset'];
  contentLayout: PreferencesState['contentLayout'];
}) => {
  const [store] = useState<StoreApi<PreferencesState>>(() =>
    createPreferencesStore({
      font,
      themeMode,
      navbarStyle,
      themePreset,
      contentLayout,
    }),
  );

  const domSnapshotRef = useRef<Partial<PreferencesState> | null>(null);

  useEffect(() => {
    const domState = readDomState();
    domSnapshotRef.current = domState;

    store.setState((prev) => ({
      ...prev,
      ...domState,
      isSynced: true,
    }));
  }, [store]);

  useEffect(() => {
    let unsubscribeMedia: (() => void) | undefined;

    const applyFromMode = (mode: PreferencesState['themeMode']) => {
      unsubscribeMedia?.();
      const resolved = applyThemeMode(mode);
      store.setState((prev) => ({ ...prev, resolvedThemeMode: resolved }));

      if (mode === 'system') {
        unsubscribeMedia = subscribeToSystemTheme(() => {
          const next = applyThemeMode('system');
          store.setState((prev) => ({ ...prev, resolvedThemeMode: next }));
        });
      }
    };

    const startMode = domSnapshotRef.current?.themeMode ?? store.getState().themeMode;
    applyFromMode(startMode);

    const unsubscribeStore = store.subscribe((s, p) => {
      if (s.themeMode !== p.themeMode) applyFromMode(s.themeMode);
    });

    return () => {
      unsubscribeMedia?.();
      unsubscribeStore();
    };
  }, [store]);

  return (
    <PreferencesStoreContext.Provider value={store}>{children}</PreferencesStoreContext.Provider>
  );
};

export const usePreferencesStore = <T,>(selector: (state: PreferencesState) => T): T => {
  const store = useContext(PreferencesStoreContext);
  if (!store) throw new Error('Missing PreferencesStoreProvider');
  return useStore(store, selector);
};
