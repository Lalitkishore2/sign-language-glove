/**
 * GloveConnection.js — WebSockets API utility for connecting to the ISL-Glove ESP32 over WiFi.
 * 
 * Exposes a simple API:
 *   connectGlove(ip)  → Connects to ws://[IP]:81/, returns connection state
 *   disconnectGlove() → Cleanly disconnects
 *   onGloveData(cb)   → Registers a callback for incoming sensor packets
 * 
 * Data format from ESP32:
 *   {"g":"MORNING","c":98,"f":[0,0,0,0,0],"r":1.2,"p":0.5}
 */

let ws = null;
let dataCallback = null;
let connectionCallback = null;

export function onGloveData(callback) {
  dataCallback = callback;
}

export function onConnectionChange(callback) {
  connectionCallback = callback;
}

export function isGloveConnected() {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export async function connectGlove(ip) {
  if (!ip) {
    console.error('[Glove] No IP address provided');
    return false;
  }

  return new Promise((resolve, reject) => {
    try {
      const wsUrl = `ws://${ip}:81/`;
      console.log(`[Glove] Connecting to ${wsUrl}...`);
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Glove] Connected to WebSocket');
        if (connectionCallback) connectionCallback(true);
        resolve(true);
      };

      ws.onmessage = (event) => {
        try {
          const trimmed = event.data.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const data = JSON.parse(trimmed);
            if (dataCallback) {
              dataCallback({
                gesture: data.g || '',
                confidence: data.c || 0,
                flex: data.f || [0, 0, 0, 0, 0],
                roll: data.r || 0,
                pitch: data.p || 0,
                raw: trimmed
              });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        console.log('[Glove] Disconnected from WebSocket');
        ws = null;
        if (connectionCallback) connectionCallback(false);
      };

      ws.onerror = (error) => {
        console.error('[Glove] WebSocket error:', error);
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws = null;
          if (connectionCallback) connectionCallback(false);
          resolve(false);
        }
      };
      
      // Timeout after 5 seconds if connection fails
      setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
          ws = null;
          resolve(false);
        }
      }, 5000);

    } catch (error) {
      console.error('[Glove] Connection failed:', error);
      ws = null;
      if (connectionCallback) connectionCallback(false);
      resolve(false);
    }
  });
}

export async function disconnectGlove() {
  if (ws) {
    ws.close();
    ws = null;
    console.log('[Glove] Disconnected');
  }
  if (connectionCallback) connectionCallback(false);
}
