/**
 * GloveConnection.js — Web Bluetooth API utility for connecting to the ISL-Glove ESP32.
 * 
 * Exposes a simple API:
 *   connectGlove()    → Prompts BLE pairing, returns connection object
 *   disconnectGlove() → Cleanly disconnects
 *   onGloveData(cb)   → Registers a callback for incoming sensor packets
 * 
 * Data format from ESP32:
 *   {"g":"MORNING","c":98,"f":[0,0,0,0,0],"r":1.2,"p":0.5}
 */

const SERVICE_UUID      = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHAR_UUID         = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let device = null;
let characteristic = null;
let dataCallback = null;
let connectionCallback = null;

function handleNotification(event) {
  const value = event.target.value;
  const decoder = new TextDecoder('utf-8');
  const jsonStr = decoder.decode(value);
  
  try {
    const data = JSON.parse(jsonStr);
    if (dataCallback) {
      dataCallback({
        gesture: data.g || '',
        confidence: data.c || 0,
        flex: data.f || [0, 0, 0, 0, 0],
        roll: data.r || 0,
        pitch: data.p || 0,
        raw: jsonStr
      });
    }
  } catch (e) {
    // Silently ignore malformed packets
  }
}

export function onGloveData(callback) {
  dataCallback = callback;
}

export function onConnectionChange(callback) {
  connectionCallback = callback;
}

export function isGloveConnected() {
  return device?.gatt?.connected || false;
}

export async function connectGlove() {
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'ISL-Glove' }],
      optionalServices: [SERVICE_UUID]
    });

    device.addEventListener('gattserverdisconnected', () => {
      console.log('[Glove] Disconnected');
      characteristic = null;
      if (connectionCallback) connectionCallback(false);
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHAR_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', handleNotification);

    console.log('[Glove] Connected and listening for notifications');
    if (connectionCallback) connectionCallback(true);
    return true;
  } catch (error) {
    console.error('[Glove] Connection failed:', error);
    if (connectionCallback) connectionCallback(false);
    return false;
  }
}

export async function disconnectGlove() {
  if (characteristic) {
    try {
      characteristic.removeEventListener('characteristicvaluechanged', handleNotification);
      await characteristic.stopNotifications();
    } catch (e) { /* ignore */ }
    characteristic = null;
  }
  if (device?.gatt?.connected) {
    device.gatt.disconnect();
  }
  device = null;
  if (connectionCallback) connectionCallback(false);
}
