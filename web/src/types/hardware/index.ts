/**
 * @fileoverview Type definitions for Kinex physical hardware & Web Bluetooth API connections.
 */

/**
 * Smart Glove sensor data inputs.
 */
export interface ISmartGlove {
  deviceId: string;
  battery: number;
  flexSensors: {
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  };
  imu: {
    pitch: number;
    roll: number;
    yaw: number;
  };
}

/**
 * Bluetooth Low Energy device metadata.
 */
export interface IBLEDevice {
  gattServer: any;
  serviceUUID: string;
  characteristicUUID: string;
}

/**
 * Head-mounted smart glasses representation.
 */
export interface ISmartGlasses {
  deviceId: string;
  screenResolution: { width: number; height: number };
  audioLatencyMs: number;
  isConnected: boolean;
}

/**
 * Electromyography wearable sensors for muscle signal gestures.
 */
export interface IEMGDevice {
  deviceId: string;
  channels: number[];
  samplingRateHz: number;
}
