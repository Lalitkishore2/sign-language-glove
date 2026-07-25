/**
 * @fileoverview Wrapper service for Google MediaPipe Hand tracking.
 * Abstracts loading, initializing, and streaming models.
 */
import {
  HandLandmarker,
  PoseLandmarker,
  FilesetResolver,
  HandLandmarkerResult,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface CombinedLandmarks {
  hand: HandLandmarkerResult | null;
  pose: PoseLandmarkerResult | null;
}

export class MediaPipeService {
  private static handLandmarker: HandLandmarker | null = null;
  private static poseLandmarker: PoseLandmarker | null = null;
  private static isInitializing = false;
  private static lastVideoTime = -1;
  private static lastHandResult: HandLandmarkerResult | null = null;
  private static lastPoseResult: PoseLandmarkerResult | null = null;

  /**
   * Loads the MediaPipe hand and pose tracking files asynchronously.
   * Bundled locally via /wasm and /models to avoid CDN dependence.
   */
  static async loadModel(): Promise<void> {
    if ((this.handLandmarker && this.poseLandmarker) || this.isInitializing) return;

    try {
      this.isInitializing = true;
      const vision = await FilesetResolver.forVisionTasks("/wasm");
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/models/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (error) {
      console.error("Failed to load MediaPipe Landmarkers:", error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Process raw video frames to extract hand and pose skeletal landmark coordinate results.
   */
  static processFrame(videoElement: HTMLVideoElement): CombinedLandmarks | null {
    if (!this.handLandmarker || !this.poseLandmarker || !videoElement) return null;
    
    // Ensure the video has loaded metadata and is playing
    if (videoElement.readyState < 2) return null;

    const currentTime = videoElement.currentTime;

    // Process only if we have a new frame
    if (currentTime !== this.lastVideoTime) {
      this.lastHandResult = this.handLandmarker.detectForVideo(videoElement, performance.now());
      this.lastPoseResult = this.poseLandmarker.detectForVideo(videoElement, performance.now());
      this.lastVideoTime = currentTime;
    }

    return {
      hand: this.lastHandResult,
      pose: this.lastPoseResult,
    };
  }
}

