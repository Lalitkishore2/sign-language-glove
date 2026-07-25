/**
 * @fileoverview Safe API endpoints layer to communicate with recognition engine server.
 */
import { ENV } from "../config/env";

export const recognitionApi = {
  /**
   * Submit coordinates of hand skeleton for server classification.
   */
  async classifyGesture(landmarks: unknown): Promise<Response> {
    return await fetch(`${ENV.RECOGNITION_SERVER_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landmarks }),
    });
  },

  /**
   * Ping classification model status.
   */
  async checkModelHealth(): Promise<Response> {
    return await fetch(`${ENV.RECOGNITION_SERVER_URL}/health`);
  },
};
