/**
 * GloveConnection.js — Web Serial API utility for connecting to the ISL-Glove ESP32.
 * 
 * Exposes a simple API:
 *   connectGlove()    → Prompts Serial port selection, returns connection object
 *   disconnectGlove() → Cleanly disconnects
 *   onGloveData(cb)   → Registers a callback for incoming sensor packets
 * 
 * Data format from ESP32:
 *   {"g":"MORNING","c":98,"f":[0,0,0,0,0],"r":1.2,"p":0.5}
 */

let port = null;
let reader = null;
let keepReading = false;
let dataCallback = null;
let connectionCallback = null;

export function onGloveData(callback) {
  dataCallback = callback;
}

export function onConnectionChange(callback) {
  connectionCallback = callback;
}

export function isGloveConnected() {
  return port !== null;
}

async function readLoop() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();

  let partialLine = "";

  try {
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        partialLine += value;
        const lines = partialLine.split('\n');
        partialLine = lines.pop(); // Keep the incomplete line for the next chunk
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
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
            } catch (e) {
              // Ignore parse errors from partial/corrupted lines
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[Glove] Serial read error:", error);
  } finally {
    reader.releaseLock();
  }
}

export async function connectGlove() {
  if (!("serial" in navigator)) {
    alert("Web Serial API is not supported by your browser. Try Google Chrome or Microsoft Edge on Desktop.");
    return false;
  }

  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 }); // Must match ESP32 Serial.begin(115200)

    keepReading = true;
    readLoop();

    console.log('[Glove] Connected to Serial Port');
    if (connectionCallback) connectionCallback(true);
    return true;
  } catch (error) {
    console.error('[Glove] Serial connection failed:', error);
    port = null;
    if (connectionCallback) connectionCallback(false);
    return false;
  }
}

export async function disconnectGlove() {
  if (port) {
    keepReading = false;
    if (reader) {
      await reader.cancel();
    }
    await port.close();
    port = null;
    console.log('[Glove] Disconnected from Serial Port');
  }
  if (connectionCallback) connectionCallback(false);
}

// Automatically handle disconnection if the USB is unplugged
if ("serial" in navigator) {
  navigator.serial.addEventListener("disconnect", (event) => {
    if (port && event.target === port) {
      disconnectGlove();
    }
  });
}
