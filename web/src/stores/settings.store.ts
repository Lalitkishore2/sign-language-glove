/**
 * @fileoverview Settings and Accessibility Preferences store.
 */
import { create } from "zustand";

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  voiceVolume: number; // 0 to 1
  speechRate: number; // 0.5 to 2
}

interface SettingsState {
  accessibility: AccessibilitySettings;
  updateAccessibility: (updates: Partial<AccessibilitySettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    voiceVolume: 0.8,
    speechRate: 1.0,
  },
  updateAccessibility: (updates) =>
    set((state) => ({
      accessibility: { ...state.accessibility, ...updates },
    })),
}));
