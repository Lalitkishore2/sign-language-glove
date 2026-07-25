/**
 * @fileoverview Queue for scheduling inference requests and handling backpressure.
 */
import { RecognitionTransport, PredictResponse } from "./transport";

export class InferenceQueue {
  private isProcessing: boolean = false;
  private pendingSequence: number[][] | null = null;
  private transport: RecognitionTransport;

  constructor(transport: RecognitionTransport) {
    this.transport = transport;
  }

  /**
   * Enqueues a temporal sequence for inference.
   * If an inference is already running, the sequence is buffered.
   * If a new sequence arrives while one is already pending, the old one is dropped (latest-frame-wins backpressure).
   */
  async enqueue(sequence: number[][], onResult: (res: PredictResponse) => void): Promise<void> {
    if (this.isProcessing) {
      // Drop older pending sequences to prevent latency bloat
      this.pendingSequence = sequence;
      return;
    }

    this.isProcessing = true;
    try {
      const response = await this.transport.predict(sequence);
      onResult(response);
    } catch (error) {
      console.error("Inference request failed:", error);
    } finally {
      this.isProcessing = false;
      this.processNext(onResult);
    }
  }

  private processNext(onResult: (res: PredictResponse) => void) {
    if (this.pendingSequence) {
      const seq = this.pendingSequence;
      this.pendingSequence = null;
      this.enqueue(seq, onResult);
    }
  }
}
