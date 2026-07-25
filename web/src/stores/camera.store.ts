/**
 * @fileoverview Camera State Management store.
 * Tracks active devices, permission statuses, camera feed state, etc.
 */
import { create } from "zustand";

interface CameraState {
  hasPermission: boolean | null;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  isStreaming: boolean;
  setPermission: (status: boolean) => void;
  setDevices: (devices: MediaDeviceInfo[]) => void;
  setActiveDevice: (deviceId: string) => void;
  setStreaming: (status: boolean) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  hasPermission: null,
  devices: [],
  activeDeviceId: null,
  isStreaming: false,
  setPermission: (status) => set({ hasPermission: status }),
  setDevices: (devices) => set({ devices }),
  setActiveDevice: (deviceId) => set({ activeDeviceId: deviceId }),
  setStreaming: (status) => set({ isStreaming: status }),
}));
