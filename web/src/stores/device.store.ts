/**
 * @fileoverview Device Hub State Management store.
 * Connects, tracks, and manages future wearable devices (Smart Gloves, Bluetooth connections).
 */
import { create } from "zustand";

interface HapticDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
}

interface DeviceState {
  connectedDevices: HapticDevice[];
  isScanning: boolean;
  addDevice: (device: HapticDevice) => void;
  removeDevice: (id: string) => void;
  setScanning: (status: boolean) => void;
  toggleConnection: (id: string) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  connectedDevices: [
    { id: "cam-1", name: "Primary Camera", connected: true },
    { id: "glove-1", name: "Haptic Glove X1", connected: false, batteryLevel: 0 },
  ],
  isScanning: false,
  addDevice: (device) =>
    set((state) => ({ connectedDevices: [...state.connectedDevices, device] })),
  removeDevice: (id) =>
    set((state) => ({
      connectedDevices: state.connectedDevices.filter((d) => d.id !== id),
    })),
  setScanning: (status) => set({ isScanning: status }),
  toggleConnection: (id) =>
    set((state) => ({
      connectedDevices: state.connectedDevices.map((d) =>
        d.id === id ? { ...d, connected: !d.connected } : d
      ),
    })),
}));
