/**
 * @fileoverview Translation checking page.
 * Uses stored alphabet landmark templates and MediaPipe live landmarks.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { CameraService } from "@/services/camera/camera.service";
import { MediaPipeService } from "@/services/mediapipe/mediapipe.service";
import { useRecognition } from "@/hooks/useRecognition";
import { useRecognitionStore } from "@/stores/recognition.store";
import { classifyAlphabet, normalizeTwoHands } from "./gestureClassifier";
import { loadTranslateWorkspaceData } from "./translateData";
import { useGloveStore } from "@/stores/gloveStore";
import { Camera, Layers, Activity } from "lucide-react";

export function TranslatePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameLoopRef = useRef<number | null>(null);

  const historyRef = useRef<string[]>([]);
  const liveSequenceRef = useRef<number[][]>([]);
  const lastStableRef = useRef<string>("");
  const stableCountRef = useRef(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState("No Hand Detected");
  const [confidence, setConfidence] = useState(0);
  const [visionPrediction, setVisionPrediction] = useState("No Hand Detected");
  const [visionConfidence, setVisionConfidence] = useState(0);
  const [outputText, setOutputText] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);

  const [minConfidence, setMinConfidence] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("kinex_min_confidence_threshold");
      return saved ? Number(saved) : 35;
    } catch {
      return 35;
    }
  });

  const handleMinConfidenceChange = (value: number) => {
    setMinConfidence(value);
    try {
      localStorage.setItem("kinex_min_confidence_threshold", String(value));
    } catch {
      // ignore
    }
  };

  const [workspaceData, setWorkspaceData] = useState(loadTranslateWorkspaceData);

  useEffect(() => {
    const syncWorkspaceTemplates = () => {
      setWorkspaceData(loadTranslateWorkspaceData());
    };

    syncWorkspaceTemplates();
    window.addEventListener("focus", syncWorkspaceTemplates);
    return () => {
      window.removeEventListener("focus", syncWorkspaceTemplates);
    };
  }, []);

  const templates = workspaceData.alphabetTemplates;
  const templateCount = Object.keys(templates).length;

  const detectedWord = useRecognitionStore((state) => state.detectedWord);
  const wordConfidence = useRecognitionStore((state) => state.confidence);
  const isWordProcessing = useRecognitionStore((state) => state.isProcessing);

  const { inputMode, setInputMode, telemetry: gloveTelemetry, connected: gloveConnected, isSimulating } = useGloveStore();

  // Multi-Modal Fused Prediction Effect
  useEffect(() => {
    if (inputMode === 'glove') {
      if (gloveTelemetry.gesture && gloveTelemetry.gesture !== 'WAITING' && gloveTelemetry.gesture !== 'DISCONNECTED') {
        setPrediction(gloveTelemetry.gesture);
        setConfidence(gloveTelemetry.confidence);
      } else {
        setPrediction('Glove Active (Waiting Pose)');
        setConfidence(0);
      }
    } else if (inputMode === 'hybrid') {
      const hasGlove = gloveTelemetry.gesture && gloveTelemetry.gesture !== 'WAITING' && gloveTelemetry.gesture !== 'DISCONNECTED';
      const hasVision = visionPrediction && visionPrediction !== 'No Hand Detected';

      if (hasGlove && hasVision) {
        if (gloveTelemetry.gesture.toUpperCase() === visionPrediction.toUpperCase()) {
          setPrediction(`${gloveTelemetry.gesture} (Fused Match)`);
          setConfidence(Math.min(99, Math.max(gloveTelemetry.confidence, visionConfidence) + 10));
        } else {
          setPrediction(gloveTelemetry.confidence >= visionConfidence ? gloveTelemetry.gesture : visionPrediction);
          setConfidence(Math.max(gloveTelemetry.confidence, visionConfidence));
        }
      } else if (hasGlove) {
        setPrediction(gloveTelemetry.gesture);
        setConfidence(gloveTelemetry.confidence);
      } else if (hasVision) {
        setPrediction(visionPrediction);
        setConfidence(visionConfidence);
      } else {
        setPrediction('Waiting Dual Feed...');
        setConfidence(0);
      }
    } else {
      setPrediction(visionPrediction);
      setConfidence(visionConfidence);
    }
  }, [inputMode, gloveTelemetry, visionPrediction, visionConfidence]);

  const speakText = useCallback((text: string) => {
    if (!text.trim() || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const appendRecognizedSymbol = useCallback(
    (symbol: string) => {
      setOutputText((prev) => {
        const separator = !prev || prev.endsWith(" ") || symbol.length === 1 ? "" : " ";
        const next = `${prev}${separator}${symbol}`;
        if (autoSpeak) {
          speakText(symbol);
        }
        return next;
      });
    },
    [autoSpeak, speakText]
  );

  const lastCandidateSignRef = useRef<string>("");
  const candidateStableCountRef = useRef<number>(0);
  const lastAppendedSignRef = useRef<string>("");
  const lastAppendedTimeRef = useRef<number>(0);

  // Automatically append stabilized prediction symbols to Translation Output
  useEffect(() => {
    if (!prediction) {
      candidateStableCountRef.current = 0;
      lastCandidateSignRef.current = "";
      return;
    }

    const lower = prediction.toLowerCase();
    const isStatus =
      lower.includes("no hand") ||
      lower.includes("waiting") ||
      lower.includes("initializing") ||
      lower.includes("offline") ||
      lower.includes("no templates") ||
      lower.includes("unknown");

    if (isStatus) {
      candidateStableCountRef.current = 0;
      lastCandidateSignRef.current = "";
      return;
    }

    const cleanSign = prediction.replace(/\s*\(.*\)/, "").trim().toUpperCase();
    if (!cleanSign) return;

    if (cleanSign === lastCandidateSignRef.current) {
      candidateStableCountRef.current += 1;
    } else {
      lastCandidateSignRef.current = cleanSign;
      candidateStableCountRef.current = 1;
    }

    // Require sign to be held steadily for 3 consecutive frames (~150ms)
    if (candidateStableCountRef.current >= 3) {
      const now = Date.now();
      // Prevent duplicate word spam if exact same sign was appended < 2500ms ago
      if (cleanSign === lastAppendedSignRef.current && now - lastAppendedTimeRef.current < 2500) {
        return;
      }

      lastAppendedSignRef.current = cleanSign;
      lastAppendedTimeRef.current = now;
      appendRecognizedSymbol(cleanSign);
    }
  }, [prediction, appendRecognizedSymbol]);

  useRecognition(videoRef, cameraReady);

  const drawLandmarks = useCallback((landmarks: Array<Array<{ x: number; y: number }>>) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const width = video.videoWidth || canvas.clientWidth;
    const height = video.videoHeight || canvas.clientHeight;
    if (!width || !height) return;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#45dafc";
    ctx.lineWidth = 1.5;

    landmarks.forEach((hand) => {
      hand.forEach((point) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    });
  }, []);

  const clearLandmarks = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const processRecognitionFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const result = MediaPipeService.processFrame(videoRef.current);
    const hand = result?.hand;
    if (!hand || !hand.landmarks || hand.landmarks.length === 0) {
      clearLandmarks();
      setVisionPrediction("No Hand Detected");
      setVisionConfidence(0);
      historyRef.current = [];
      liveSequenceRef.current = [];
      stableCountRef.current = 0;
      return;
    }

    drawLandmarks(hand.landmarks as Array<Array<{ x: number; y: number }>>);

    if (templateCount === 0) {
      setVisionPrediction("Hand Detected (No Templates)");
      setVisionConfidence(0);
      historyRef.current = [];
      liveSequenceRef.current = [];
      stableCountRef.current = 0;
      return;
    }

    const normalized = normalizeTwoHands(hand.landmarks as any, hand.handedness as any);
    liveSequenceRef.current.push(normalized);
    if (liveSequenceRef.current.length > 100) {
      liveSequenceRef.current.shift();
    }

    const classified = classifyAlphabet(normalized, templates, liveSequenceRef.current, [], minConfidence);

    const activeLabel = classified.label !== "Unknown" ? classified.label : "Unknown";
    setVisionPrediction(activeLabel);
    setVisionConfidence(classified.confidence);

    if (activeLabel !== "Unknown" && activeLabel !== "No Hand Detected" && activeLabel !== "No Alphabet Templates") {
      if (activeLabel === lastStableRef.current) {
        stableCountRef.current += 1;
        if (stableCountRef.current === 6) {
          appendRecognizedSymbol(activeLabel);
        }
      } else {
        lastStableRef.current = activeLabel;
        stableCountRef.current = 1;
      }
    } else {
      stableCountRef.current = 0;
      lastStableRef.current = "";
    }
  }, [appendRecognizedSymbol, clearLandmarks, drawLandmarks, templateCount, templates]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);

      await MediaPipeService.loadModel();
      const stream = await CameraService.startStream();
      streamRef.current = stream;
      
      if (videoRef.current) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          // Ignore transient AbortError when play request is interrupted by re-render
          if (playErr.name !== "AbortError" && !playErr.message?.includes("interrupted")) {
            throw playErr;
          }
        }
      }

      const loop = () => {
        processRecognitionFrame();
        frameLoopRef.current = requestAnimationFrame(loop);
      };

      frameLoopRef.current = requestAnimationFrame(loop);
      setCameraReady(true);
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message?.includes("interrupted")) {
        console.warn("[Camera] Play request interrupted, ignoring transient abort");
        return;
      }
      setCameraError(error?.message ?? "Unable to access camera");
      setCameraReady(false);
    }
  }, [processRecognitionFrame]);

  useEffect(() => {
    startCamera();
    return () => {
      if (frameLoopRef.current !== null) {
        cancelAnimationFrame(frameLoopRef.current);
      }
      CameraService.stopStream();
      streamRef.current = null;
    };
  }, [startCamera]);

  return (
    <WorkspaceLayout fullHeight headerTitle="Translation Check">
      <div className="flex-1 overflow-hidden p-lg">
        <div className="grid h-full grid-cols-1 gap-lg xl:grid-cols-[1.35fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-primary shadow-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Live translation camera feed"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            />

            <div className="absolute left-md top-md flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-elevated/80 px-3 py-1.5 backdrop-blur-sm">
                <span className={`h-2 w-2 rounded-full ${cameraReady ? "bg-success" : "bg-warning"}`} />
                <span className="text-label-sm text-on-surface">
                  {cameraReady ? "Live Recognition" : "Initializing"}
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center rounded-full border border-outline-variant/40 bg-surface-elevated/90 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setInputMode('camera')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'camera'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('hybrid')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    inputMode === 'hybrid'
                      ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Dual Hybrid Mode</span>
                </button>
              </div>
            </div>

            {/* Live Glove Sensor Values Overlay Panel */}
            {(inputMode === 'glove' || inputMode === 'hybrid') && (
              <div className="absolute bottom-md left-md right-md rounded-xl border border-slate-700/80 bg-slate-950/85 p-3.5 backdrop-blur-md shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white">Live Smart Glove Telemetry</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded-full border ${
                      gloveConnected
                        ? isSimulating ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {gloveConnected ? (isSimulating ? 'Simulator' : 'Live WiFi') : 'Offline'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-purple-300">
                    Roll: <strong>{(gloveTelemetry.roll || 0).toFixed(1)}°</strong> | Pitch: <strong>{(gloveTelemetry.pitch || 0).toFixed(1)}°</strong>
                  </span>
                </div>

                {/* 5 Flex Sensors Live Progress Bars */}
                <div className="grid grid-cols-5 gap-2">
                  {['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'].map((finger, idx) => {
                    const val = (gloveTelemetry.flex && gloveTelemetry.flex[idx]) || 0;
                    return (
                      <div key={idx} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">{finger}</span>
                          <span className="font-mono text-indigo-300 font-bold">{val}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-150 ${val > 50 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-emerald-400 to-indigo-500'}`}
                            style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {cameraError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-primary/95 p-lg">
                <div className="max-w-md rounded-xl border border-error/30 bg-error-container p-lg text-center text-on-error-container">
                  <h3 className="mb-sm text-title-lg">Camera unavailable</h3>
                  <p className="text-body-md">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-md rounded-lg bg-error px-4 py-2 text-on-error"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="flex min-h-0 flex-col gap-md overflow-y-auto pr-1">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-secondary p-md">
              <h2 className="mb-sm text-title-lg text-on-surface flex items-center justify-between">
                <span>Live Prediction</span>
                <span className="text-xs font-mono text-indigo-400 capitalize">
                  Mode: {inputMode === 'hybrid' ? 'Dual Hybrid (Fused)' : inputMode === 'glove' ? 'Smart Glove' : 'Camera Vision'}
                </span>
              </h2>
              <div className="rounded-xl border border-outline-variant/40 bg-surface-primary p-md flex items-center justify-between gap-md">
                <div>
                  <p className="text-label-sm text-on-surface-variant">Combined Output Symbol</p>
                  <p className="text-display-sm text-primary font-bold">{prediction}</p>
                  <p className="text-label-sm text-on-surface-variant">Confidence Score: {confidence.toFixed(1)}%</p>
                </div>
                {prediction && !prediction.toLowerCase().includes("no hand") && !prediction.toLowerCase().includes("waiting") && !prediction.toLowerCase().includes("offline") && (
                  <button
                    type="button"
                    onClick={() => {
                      const cleanSign = prediction.replace(/\s*\(.*\)/, "").trim().toUpperCase();
                      if (cleanSign) appendRecognizedSymbol(cleanSign);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shrink-0"
                  >
                    + Add to Output
                  </button>
                )}
              </div>

              {/* Hybrid Multi-Modal Breakdown */}
              {inputMode === 'hybrid' && (
                <div className="mt-sm grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <p className="text-[11px] text-slate-400">Camera Vision</p>
                    <p className="font-bold text-indigo-300 truncate">{visionPrediction}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{visionConfidence.toFixed(0)}% Conf</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">
                    <p className="text-[11px] text-slate-400">Smart Glove</p>
                    <p className="font-bold text-purple-300 truncate">{gloveTelemetry.gesture || 'WAITING'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{(gloveTelemetry.confidence || 0)}% Conf</p>
                  </div>
                </div>
              )}

              {/* Detection Confidence Threshold Control */}
              <div className="mt-sm rounded-xl border border-outline-variant/40 bg-surface-primary p-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-on-surface">Minimum Detection Confidence</span>
                  <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                    {minConfidence}% Required
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  step="5"
                  value={minConfidence}
                  onChange={(e) => handleMinConfidenceChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>10% (Ultra Sensitive)</span>
                  <span>35% (Recommended)</span>
                  <span>90% (Strict)</span>
                </div>
              </div>

              <p className="mt-sm text-label-sm text-on-surface-variant">
                Templates loaded: {templateCount}
              </p>
              <div className="mt-sm rounded-xl border border-outline-variant/40 bg-surface-primary p-md">
                <p className="text-label-sm text-on-surface-variant">Backend Word Prediction</p>
                <p className="text-display-sm text-secondary">{detectedWord || "Waiting for model"}</p>
                <p className="text-label-sm text-on-surface-variant">
                  Confidence: {wordConfidence.toFixed(1)}% {isWordProcessing ? "· Processing" : ""}
                </p>
              </div>
              {templateCount === 0 ? (
                <p className="mt-2 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-label-sm text-warning">
                  No templates found. Go to Dataset page and store at least one named word or alphabet.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-secondary p-md">
              <div className="mb-sm flex items-center justify-between gap-sm">
                <h2 className="text-title-lg text-on-surface">Translation Output</h2>
                <button
                  onClick={() => setAutoSpeak((prev) => !prev)}
                  className={`rounded-full px-3 py-1.5 text-label-sm ${autoSpeak ? "bg-primary text-on-primary" : "bg-surface-elevated text-on-surface"}`}
                >
                  {autoSpeak ? "Auto Speak On" : "Auto Speak Off"}
                </button>
              </div>

              <textarea
                value={outputText}
                onChange={(event) => setOutputText(event.target.value)}
                placeholder="Recognized alphabet output will appear here..."
                className="min-h-40 w-full rounded-xl border border-outline-variant/40 bg-surface-primary p-md text-body-lg text-on-surface outline-none focus:border-primary"
              />

              <div className="mt-sm flex flex-wrap gap-sm">
                <button
                  onClick={() => speakText(outputText)}
                  className="rounded-lg bg-secondary px-4 py-2 text-on-secondary"
                >
                  Speak
                </button>
                <button
                  onClick={() => setOutputText((prev) => prev + " ")}
                  className="rounded-lg bg-surface-elevated px-4 py-2 text-on-surface"
                >
                  Space
                </button>
                <button
                  onClick={() => setOutputText((prev) => prev.slice(0, -1))}
                  className="rounded-lg bg-surface-elevated px-4 py-2 text-on-surface"
                >
                  Backspace
                </button>
                <button
                  onClick={() => setOutputText("")}
                  className="rounded-lg bg-error px-4 py-2 text-on-error"
                >
                  Clear
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
