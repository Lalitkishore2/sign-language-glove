/**
 * @fileoverview Core Recognition Engine wrapping the FrameBuffer, InferenceQueue, and Transport.
 */
import { FrameBuffer } from "./frame.buffer";
import { InferenceQueue } from "./inference.queue";
import { RESTTransport, PredictResponse } from "./transport";
import { CombinedLandmarks } from "../mediapipe/mediapipe.service";
import { FeatureExtractor } from "./feature.extractor";

export class RecognitionEngine {
  private frameBuffer: FrameBuffer;
  private inferenceQueue: InferenceQueue;
  private onPredictionCallback: ((response: PredictResponse) => void) | null = null;

  constructor() {
    this.frameBuffer = new FrameBuffer(16);
    // Uses REST transport by default, can be injected for WebSocket in the future
    this.inferenceQueue = new InferenceQueue(new RESTTransport());
  }

  public setOnPrediction(callback: (response: PredictResponse) => void) {
    this.onPredictionCallback = callback;
  }

  /**
   * Processes a raw MediaPipe frame (pose + hands), extracts features, buffers them,
   * and triggers inference if the buffer is full.
   */
  public processMediaPipeResult(result: CombinedLandmarks | null) {
    const features = FeatureExtractor.extractFeatures(result);
    const sequence = this.frameBuffer.push(features);

    if (sequence) {
      this.inferenceQueue.enqueue(sequence, (response) => {
        if (this.onPredictionCallback) {
          this.onPredictionCallback(response);
        }
      });
    }
  }

  public reset() {
    this.frameBuffer.clear();
  }
}

