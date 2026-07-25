/**
 * @fileoverview Hook integrating MediaPipe frame processor feed and Recognition engine events.
 */
import { useEffect, useRef, type RefObject } from "react";
import { useRecognitionStore } from "../stores/recognition.store";
import { MediaPipeService } from "../services/mediapipe/mediapipe.service";
import { RecognitionEngine } from "../services/recognition/recognition.engine";

export function useRecognition(videoRef: RefObject<HTMLVideoElement | null>, isActive: boolean) {
  const { setDetectedWord, setConfidence, setProcessing } = useRecognitionStore();
  const engineRef = useRef<RecognitionEngine | null>(null);

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new RecognitionEngine();
      engineRef.current.setOnPrediction((response) => {
        if (response.predictions && response.predictions.length > 0) {
          const topResult = response.predictions[0];
          setDetectedWord(topResult.gloss);
          setConfidence(topResult.confidence);
        }
      });
    }
  }, [setDetectedWord, setConfidence]);

  useEffect(() => {
    if (!isActive || !videoRef.current || !engineRef.current) return;

    let animationFrameId: number;
    let isRunning = true;

    const processLoop = () => {
      if (!isRunning) return;
      
      if (videoRef.current) {
        setProcessing(true);
        const result = MediaPipeService.processFrame(videoRef.current);
        engineRef.current!.processMediaPipeResult(result);
        setProcessing(false);
      }
      animationFrameId = requestAnimationFrame(processLoop);
    };

    // Load models before loop start
    MediaPipeService.loadModel().then(() => {
      if (isRunning) {
        animationFrameId = requestAnimationFrame(processLoop);
      }
    });

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      engineRef.current?.reset();
      setProcessing(false);
    };
  }, [isActive, videoRef, setProcessing]);
}
