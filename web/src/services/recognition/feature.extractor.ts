import { CombinedLandmarks } from "../mediapipe/mediapipe.service";

export class FeatureExtractor {
  /**
   * Processes MediaPipe result into a flattened 1D feature vector of size 134.
   * Layout:
   * - Pose: 25 landmarks * 2 (x,y) = 50 features
   * - Left Hand: 21 landmarks * 2 (x,y) = 42 features
   * - Right Hand: 21 landmarks * 2 (x,y) = 42 features
   * Total = 134 features.
   */
  static extractFeatures(result: CombinedLandmarks | null): number[] {
    const features: number[] = new Array(134).fill(0);

    if (!result) return features;

    // 1. Extract Pose (first 25 landmarks - upper body)
    let poseBaseX = 0;
    let poseBaseY = 0;
    let poseValid = false;

    if (result.pose && result.pose.landmarks && result.pose.landmarks.length > 0) {
      const poseLandmarks = result.pose.landmarks[0];
      poseValid = true;
      // Use nose (index 0) as translation center
      poseBaseX = poseLandmarks[0].x;
      poseBaseY = poseLandmarks[0].y;

      for (let i = 0; i < 25; i++) {
        if (i < poseLandmarks.length) {
          features[i * 2] = poseLandmarks[i].x - poseBaseX;
          features[i * 2 + 1] = poseLandmarks[i].y - poseBaseY;
        }
      }
    }

    // 2. Extract Hands
    if (result.hand && result.hand.landmarks && result.hand.landmarks.length > 0) {
      for (let i = 0; i < result.hand.handedness.length; i++) {
        const handLabel = result.hand.handedness[i][0].categoryName; // "Right" or "Left"
        const landmarks = result.hand.landmarks[i];
        
        // Pose = 50. Left = 50 to 91. Right = 92 to 133.
        const handOffset = handLabel === "Left" ? 50 : 50 + 42;

        for (let j = 0; j < 21; j++) {
          if (j < landmarks.length) {
            // Translate relative to pose nose if valid, else use wrist (0)
            const baseX = poseValid ? poseBaseX : landmarks[0].x;
            const baseY = poseValid ? poseBaseY : landmarks[0].y;
            
            features[handOffset + j * 2] = landmarks[j].x - baseX;
            features[handOffset + j * 2 + 1] = landmarks[j].y - baseY;
          }
        }
      }
    }

    // 3. Scale Normalization (divide by max absolute value to keep within [-1, 1])
    let maxAbs = 0;
    for (let i = 0; i < 134; i++) {
      if (Math.abs(features[i]) > maxAbs) {
        maxAbs = Math.abs(features[i]);
      }
    }
    
    if (maxAbs > 0) {
      for (let i = 0; i < 134; i++) {
        features[i] /= maxAbs;
      }
    }

    return features;
  }
}

