/**
 * gloveService.ts — WebSocket API service for ESP32 Smart Glove.
 *
 * Connects to ws://[IP]:81/ over local WiFi, handles packet parsing,
 * heartbeat monitoring, and sends remote calibration commands.
 */

export interface GloveTelemetry {
  gesture: string;
  confidence: number;
  flex: [number, number, number, number, number]; // Thumb, Index, Middle, Ring, Pinky (0-100%)
  roll: number;  // degrees (-180 to 180)
  pitch: number; // degrees (-90 to 90)
  raw?: string;
  timestamp: number;
}

type DataCallback = (data: GloveTelemetry) => void;
type StatusCallback = (connected: boolean) => void;

interface CustomGloveSign {
  id: string;
  name: string;
  flex: [number, number, number, number, number];
  flexTol: number;
  roll: number;
  pitch: number;
  useImu: boolean;
}

function matchCustomGloveSign(
  flex: [number, number, number, number, number],
  roll: number,
  pitch: number
): { gesture: string; confidence: number } | null {
  try {
    const raw = localStorage.getItem('kinex_custom_glove_signs');
    if (!raw) return null;
    const signs: CustomGloveSign[] = JSON.parse(raw);
    if (!Array.isArray(signs) || signs.length === 0) return null;

    let bestMatch: CustomGloveSign | null = null;
    let bestScore = 0;

    for (const sign of signs) {
      let score = 0;
      let checks = 5;

      for (let i = 0; i < 5; i++) {
        const diff = Math.abs(flex[i] - sign.flex[i]);
        if (diff <= sign.flexTol) {
          score += 1.0 - diff / sign.flexTol;
        }
      }

      if (sign.useImu) {
        checks += 2;
        const rollDiff = Math.abs(roll - sign.roll);
        const pitchDiff = Math.abs(pitch - sign.pitch);
        if (rollDiff <= 35) {
          score += 1.0 - rollDiff / 35;
        }
        if (pitchDiff <= 35) {
          score += 1.0 - pitchDiff / 35;
        }
      }

      const normScore = score / checks;
      if (normScore > 0.65 && normScore > bestScore) {
        bestScore = normScore;
        bestMatch = sign;
      }
    }

    if (bestMatch) {
      return {
        gesture: bestMatch.name,
        confidence: Math.round(bestScore * 100),
      };
    }
  } catch (err) {
    console.warn('[GloveService] Error matching custom sign:', err);
  }
  return null;
}

export class GloveService {
  private ws: WebSocket | null = null;
  private dataCallbacks: Set<DataCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private ip: string = '';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isSimulating: boolean = false;
  private simulationInterval: ReturnType<typeof setInterval> | null = null;

  public getConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getIP(): string {
    return this.ip;
  }

  public onData(cb: DataCallback): () => void {
    this.dataCallbacks.add(cb);
    return () => this.dataCallbacks.delete(cb);
  }

  public onStatusChange(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  public connect(ip: string): Promise<boolean> {
    if (!ip || ip.trim() === '') {
      console.warn('[GloveService] Empty IP provided');
      return Promise.resolve(false);
    }

    this.stopSimulation();
    this.disconnect();
    this.ip = ip.trim();

    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (value: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(value);
        }
      };

      try {
        const wsUrl = `ws://${this.ip}:81/`;
        console.log(`[GloveService] Connecting to ${wsUrl}...`);
        console.log(`[GloveService] Browser location: ${window.location.href}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[GloveService] ✅ WebSocket connection established!');
          this.notifyStatus(true);
          safeResolve(true);
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const raw = String(event.data).trim();
            if (raw.startsWith('{') && raw.endsWith('}')) {
              const data = JSON.parse(raw);
              const flex: [number, number, number, number, number] = Array.isArray(data.f) && data.f.length === 5 ? (data.f as [number, number, number, number, number]) : [0, 0, 0, 0, 0];
              const roll = typeof data.r === 'number' ? data.r : 0;
              const pitch = typeof data.p === 'number' ? data.p : 0;

              const customMatch = matchCustomGloveSign(flex, roll, pitch);

              const telemetry: GloveTelemetry = {
                gesture: customMatch ? customMatch.gesture : (data.g || ''),
                confidence: customMatch ? customMatch.confidence : (typeof data.c === 'number' ? data.c : 0),
                flex,
                roll,
                pitch,
                raw,
                timestamp: Date.now(),
              };
              this.notifyData(telemetry);
            }
          } catch (e) {
            console.warn('[GloveService] Data parse error:', e);
          }
        };

        this.ws.onclose = (event: CloseEvent) => {
          console.log(`[GloveService] WebSocket closed — code: ${event.code}, reason: "${event.reason || 'none'}", wasClean: ${event.wasClean}`);
          this.ws = null;
          this.notifyStatus(false);
          safeResolve(false);
        };

        this.ws.onerror = (err) => {
          console.error('[GloveService] ❌ WebSocket error:', err);
          console.error('[GloveService] ReadyState:', this.ws?.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws = null;
            this.notifyStatus(false);
            safeResolve(false);
          }
        };

        // Timeout 8 seconds (extended from 5 for slower networks)
        setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[GloveService] Connection timed out after 8 seconds');
            this.ws.close();
            this.ws = null;
            this.notifyStatus(false);
            safeResolve(false);
          }
        }, 8000);

      } catch (err) {
        console.error('[GloveService] Exception establishing connection:', err);
        this.ws = null;
        this.notifyStatus(false);
        safeResolve(false);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
    this.notifyData({
      gesture: 'DISCONNECTED',
      confidence: 0,
      flex: [0, 0, 0, 0, 0],
      roll: 0,
      pitch: 0,
      timestamp: Date.now(),
    });
  }

  public sendCommand(cmd: string, params: Record<string, unknown> = {}): boolean {
    if (!this.getConnected() || !this.ws) {
      console.warn('[GloveService] Cannot send command: glove not connected');
      return false;
    }
    try {
      const payload = JSON.stringify({ cmd, ...params });
      this.ws.send(payload);
      return true;
    } catch (err) {
      console.error('[GloveService] Send command error:', err);
      return false;
    }
  }

  public startSimulation(): void {
    this.disconnect();
    this.isSimulating = true;
    this.notifyStatus(true);

    const sampleGestures = ['THANK YOU', 'HEARING', 'MORNING', 'I', 'BYE', 'NAME', 'INDIAN'];
    let idx = 0;

    this.simulationInterval = setInterval(() => {
      const g = sampleGestures[idx % sampleGestures.length];
      idx++;
      const telemetry: GloveTelemetry = {
        gesture: g,
        confidence: Math.floor(88 + Math.random() * 11),
        flex: [
          Math.floor(10 + Math.random() * 20),
          Math.floor(60 + Math.random() * 30),
          Math.floor(50 + Math.random() * 35),
          Math.floor(20 + Math.random() * 30),
          Math.floor(10 + Math.random() * 15),
        ],
        roll: Number((Math.sin(Date.now() / 1000) * 45).toFixed(1)),
        pitch: Number((Math.cos(Date.now() / 1000) * 30).toFixed(1)),
        raw: `{"g":"${g}","c":95,"f":[10,80,75,30,10],"r":12.5,"p":5.2}`,
        timestamp: Date.now(),
      };
      this.notifyData(telemetry);
    }, 1500);
  }

  public stopSimulation(): void {
    if (this.isSimulating) {
      this.isSimulating = false;
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      this.notifyStatus(false);
      this.notifyData({
        gesture: 'DISCONNECTED',
        confidence: 0,
        flex: [0, 0, 0, 0, 0],
        roll: 0,
        pitch: 0,
        timestamp: Date.now(),
      });
    }
  }

  public isSimulationActive(): boolean {
    return this.isSimulating;
  }

  private notifyData(data: GloveTelemetry): void {
    this.dataCallbacks.forEach((cb) => cb(data));
  }

  private notifyStatus(connected: boolean): void {
    this.statusCallbacks.forEach((cb) => cb(connected));
  }
}

export const gloveService = new GloveService();
