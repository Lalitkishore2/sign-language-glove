/**
 * @fileoverview Feature Flag configurations.
 * Used to toggle experimental modules (like Bluetooth gloves, smart glasses overlays).
 */

export const FEATURE_FLAGS = {
  ENABLE_WEARABLE_GLOVES: false,
  ENABLE_WEARABLE_GLASSES: false,
  ENABLE_EMG_DEVICES: false,
  ENABLE_GEMINI_GRAMMAR: true,
  ENABLE_OFFLINE_MODE: false,
} as const;
