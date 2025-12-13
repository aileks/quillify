import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSyncExternalStore } from 'react';

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 360;
export const SIDEBAR_DEFAULT_WIDTH = 256;

interface UIState {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      sidebarCollapsed: false,
      setSidebarWidth: (width) => {
        const clamped = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, width));
        set({ sidebarWidth: clamped });
      },
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'quillify-ui',
    }
  )
);

// Hook to safely check hydration status using useSyncExternalStore
export function useUIStoreHydrated(): boolean {
  return useSyncExternalStore(
    // Subscribe to hydration changes
    (onStoreChange) => useUIStore.persist.onFinishHydration(onStoreChange),
    // Get current hydration state (client)
    () => useUIStore.persist.hasHydrated(),
    // Get server snapshot (always false on server)
    () => false
  );
}
