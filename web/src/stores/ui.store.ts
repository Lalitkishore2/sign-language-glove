/**
 * @fileoverview UI State Management store.
 * Manages states like sidebar expanded/collapsed, active theme, active workspace, modal views, etc.
 */
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  theme: "dark" | "light";
  activeModal: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light") => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  theme: "dark",
  activeModal: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));
