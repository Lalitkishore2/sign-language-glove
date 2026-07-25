/**
 * @fileoverview Abstraction layer for network transport protocols (REST / WebSocket).
 */
import { ENV } from "../../config/env";

export interface PredictionResult {
  gloss: string;
  confidence: number;
  rank: number;
}

export interface PredictResponse {
  predictions: PredictionResult[];
  model_name: string | null;
  inference_time_ms: number;
  status: string;
  message?: string;
}

export interface RecognitionTransport {
  predict(frames: number[][]): Promise<PredictResponse>;
}

export class RESTTransport implements RecognitionTransport {
  async predict(frames: number[][]): Promise<PredictResponse> {
    const url = `${ENV.RECOGNITION_SERVER_URL}/predict`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        frames,
        num_hands: 2,
        source: "mediapipe",
        timestamp_ms: performance.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }
}
