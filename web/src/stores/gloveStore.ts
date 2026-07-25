import { create } from 'zustand';
import { gloveService, GloveTelemetry } from '../services/gloveService';

export type InputMode = 'camera' | 'glove' | 'hybrid';

interface GloveState {
  connected: boolean;
  ip: string;
  isConnecting: boolean;
  isSimulating: boolean;
  inputMode: InputMode;
  telemetry: GloveTelemetry;
  history: GloveTelemetry[];
  
  setIP: (ip: string) => void;
  setInputMode: (mode: InputMode) => void;
  connect: (ip?: string) => Promise<boolean>;
  disconnect: () => void;
  toggleSimulation: () => void;
  updateTelemetry: (data: GloveTelemetry) => void;
  calibrateFlat: () => boolean;
  calibrateFist: () => boolean;
}

const defaultTelemetry: GloveTelemetry = {
  gesture: 'WAITING',
  confidence: 0,
  flex: [0, 0, 0, 0, 0],
  roll: 0,
  pitch: 0,
  timestamp: Date.now(),
};

export const useGloveStore = create<GloveState>((set, get) => {
  // Subscribe to service events once
  gloveService.onStatusChange((connected) => {
    set({
      connected,
      isConnecting: false,
      isSimulating: gloveService.isSimulationActive(),
    });
  });

  gloveService.onData((data) => {
    const history = [data, ...get().history.slice(0, 19)];
    set({ telemetry: data, history });
  });

  return {
    connected: false,
    ip: '192.168.1.100',
    isConnecting: false,
    isSimulating: false,
    inputMode: 'camera',
    telemetry: defaultTelemetry,
    history: [],

    setIP: (ip: string) => set({ ip }),
    setInputMode: (inputMode: InputMode) => set({ inputMode }),

    connect: async (customIp?: string) => {
      const targetIp = customIp || get().ip;
      set({ isConnecting: true });
      const success = await gloveService.connect(targetIp);
      set({ isConnecting: false });
      return success;
    },

    disconnect: () => {
      gloveService.disconnect();
      gloveService.stopSimulation();
      set({ connected: false, isSimulating: false, isConnecting: false });
    },

    toggleSimulation: () => {
      if (get().isSimulating) {
        gloveService.stopSimulation();
        set({ isSimulating: false, connected: false });
      } else {
        gloveService.startSimulation();
        set({ isSimulating: true, connected: true });
      }
    },

    updateTelemetry: (telemetry: GloveTelemetry) => {
      const history = [telemetry, ...get().history.slice(0, 19)];
      set({ telemetry, history });
    },

    calibrateFlat: () => {
      return gloveService.sendCommand('calibrate_flat');
    },

    calibrateFist: () => {
      return gloveService.sendCommand('calibrate_fist');
    },
  };
});
