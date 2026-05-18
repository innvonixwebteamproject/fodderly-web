import { create } from 'zustand';
import { ReactNode } from 'react';

interface ToolbarState {
    actions: ReactNode | null;
    extraBreadcrumbs: Array<{ title: string; path: string }> | null;
    setActions: (actions: ReactNode | null) => void;
    setExtraBreadcrumbs: (breadcrumbs: Array<{ title: string; path: string }> | null) => void;
    reset: () => void;
}

export const useToolbarStore = create<ToolbarState>((set) => ({
    actions: null,
    extraBreadcrumbs: null,
    setActions: (actions) => set({ actions }),
    setExtraBreadcrumbs: (breadcrumbs) => set({ extraBreadcrumbs: breadcrumbs }),
    reset: () => set({ actions: null, extraBreadcrumbs: null }),
}));
