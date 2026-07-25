import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";
import { CameraService } from "@/services/camera/camera.service";
import { MediaPipeService } from "@/services/mediapipe/mediapipe.service";
import { normalizeTwoHands } from "./gestureClassifier";
import {
  CaptureMode,
  SignTemplate,
  TranslateWorkspaceData,
  WordCapture,
  blobToDataUrl,
  formatTimestamp,
  idbClearWorkspace,
  idbLoadWorkspace,
  loadTranslateWorkspaceData,
  saveTranslateWorkspaceData,
} from "./translateData";

function toStorageState(data: TranslateWorkspaceData) {
  return {
    captures: data.captures,
    alphabetCaptureMap: {},
    alphabetTemplates: data.alphabetTemplates,
  };
}

export function DatasetPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameLoopRef = useRef<number | null>(null);
  const recordingLandmarksRef = useRef<number[][]>([]);
  const isRecordingRef = useRef<boolean>(false);

  const initialData = useMemo(loadTranslateWorkspaceData, []);

  const [mode, setMode] = useState<CaptureMode>("static");
  const [wordLabel, setWordLabel] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [captures, setCaptures] = useState<WordCapture[]>(initialData.captures);
  const [alphabetTemplates, setAlphabetTemplates] = useState<Record<string, SignTemplate>>(
    initialData.alphabetTemplates
  );

  // Load unlimited video captures from IndexedDB on mount
  useEffect(() => {
    idbLoadWorkspace().then((idbData) => {
      if (idbData && idbData.captures.length > 0) {
        setCaptures(idbData.captures);
        setAlphabetTemplates(idbData.alphabetTemplates);
      }
    });
  }, []);

  const [selectedCaptureId, setSelectedCaptureId] = useState<string | null>(
    initialData.captures[0]?.id ?? null
  );

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

  const saveNamedTemplate = useCallback(
    (label: string) => {
      if (!videoRef.current) return false;

      const result = MediaPipeService.processFrame(videoRef.current);
      const hand = result?.hand;
      if (!hand || !hand.landmarks || hand.landmarks.length === 0) {
        return false;
      }

      const normalized = normalizeTwoHands(hand.landmarks as any, hand.handedness as any);
      setAlphabetTemplates((prev) => ({
        ...prev,
        [label]: normalized,
      }));

      return true;
    },
    []
  );

  const processPreviewFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;

    const result = MediaPipeService.processFrame(videoRef.current);
    const hand = result?.hand;
    if (!hand || !hand.landmarks || hand.landmarks.length === 0) {
      clearLandmarks();
      return;
    }

    drawLandmarks(hand.landmarks as Array<Array<{ x: number; y: number }>>);

    if (isRecordingRef.current) {
      const normalized = normalizeTwoHands(hand.landmarks as any, hand.handedness as any);
      recordingLandmarksRef.current.push(normalized);
    }
  }, [clearLandmarks, drawLandmarks]);

  const stopPreviewLoop = useCallback(() => {
    if (frameLoopRef.current !== null) {
      cancelAnimationFrame(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    clearLandmarks();
  }, [clearLandmarks]);

  const startPreviewLoop = useCallback(() => {
    stopPreviewLoop();

    const loop = () => {
      processPreviewFrame();
      frameLoopRef.current = requestAnimationFrame(loop);
    };

    frameLoopRef.current = requestAnimationFrame(loop);
  }, [processPreviewFrame, stopPreviewLoop]);

  useEffect(() => {
    saveTranslateWorkspaceData(toStorageState({ captures, alphabetCaptureMap: {}, alphabetTemplates }));
  }, [captures, alphabetTemplates]);

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
          if (playErr.name !== "AbortError" && !playErr.message?.includes("interrupted")) {
            throw playErr;
          }
        }
      }
      startPreviewLoop();
      setCameraReady(true);
    } catch (error: any) {
      if (error?.name === "AbortError" || error?.message?.includes("interrupted")) {
        console.warn("[Camera] Play request interrupted, ignoring transient abort");
        return;
      }
      setCameraError(error?.message ?? "Unable to access camera");
      setCameraReady(false);
    }
  }, [startPreviewLoop]);

  useEffect(() => {
    startCamera();
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      stopPreviewLoop();
      CameraService.stopStream();
    };
  }, [startCamera, stopPreviewLoop]);

  const addCapture = useCallback((capture: WordCapture) => {
    setCaptures((prev) => [capture, ...prev]);
    setSelectedCaptureId(capture.id);
  }, []);

  const captureStaticImage = useCallback(() => {
    if (!videoRef.current || mode !== "static") return;

    const captureLabel = wordLabel.trim();
    if (!captureLabel) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    addCapture({
      id: crypto.randomUUID(),
      mode: "static",
      kind: "image",
      label: captureLabel,
      dataUrl,
      createdAt: Date.now(),
    });

    saveNamedTemplate(captureLabel);
  }, [addCapture, mode, saveNamedTemplate, wordLabel]);

  const startRecording = useCallback(() => {
    if (!streamRef.current || mode !== "dynamic" || isRecording) return;

    const captureLabel = wordLabel.trim();
    if (!captureLabel) return;

    chunksRef.current = [];
    recordingLandmarksRef.current = [];
    isRecordingRef.current = true;
    const recordingStartTime = Date.now();

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      isRecordingRef.current = false;
      if (chunksRef.current.length === 0) {
        setIsRecording(false);
        return;
      }

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const dataUrl = await blobToDataUrl(blob);
      const durationSec = Math.max(1, Math.round((Date.now() - recordingStartTime) / 1000));

      addCapture({
        id: crypto.randomUUID(),
        mode: "dynamic",
        kind: "video",
        label: captureLabel,
        dataUrl,
        createdAt: Date.now(),
        durationSec,
      });

      // Store full motion sequence of frames recorded across the video duration
      const frames = recordingLandmarksRef.current;
      if (frames.length > 0) {
        // Subsample up to 75 keyframes evenly distributed across multi-movement video recordings
        let fullSequence: number[][] = frames;
        if (frames.length > 75) {
          const step = (frames.length - 1) / 74;
          fullSequence = [];
          for (let i = 0; i < 75; i++) {
            const idx = Math.min(Math.round(i * step), frames.length - 1);
            fullSequence.push(frames[idx]);
          }
        }
        setAlphabetTemplates((prev) => ({
          ...prev,
          [captureLabel]: fullSequence,
        }));
      } else {
        saveNamedTemplate(captureLabel);
      }

      chunksRef.current = [];
      recordingLandmarksRef.current = [];
      setIsRecording(false);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [addCapture, isRecording, mode, saveNamedTemplate, wordLabel]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
  }, []);

  const removeCapture = useCallback(
    (captureId: string) => {
      setCaptures((prevCaptures) => {
        const target = prevCaptures.find((item) => item.id === captureId);
        const nextCaptures = prevCaptures.filter((item) => item.id !== captureId);

        let nextTemplates = { ...alphabetTemplates };
        if (target) {
          const remainingWithSameLabel = nextCaptures.some((item) => item.label === target.label);
          if (!remainingWithSameLabel) {
            delete nextTemplates[target.label];
          }
        }

        setAlphabetTemplates(nextTemplates);

        saveTranslateWorkspaceData({
          captures: nextCaptures,
          alphabetCaptureMap: {},
          alphabetTemplates: nextTemplates,
        });

        return nextCaptures;
      });

      if (selectedCaptureId === captureId) {
        setSelectedCaptureId(null);
      }
    },
    [alphabetTemplates, selectedCaptureId]
  );

  const clearAllCaptures = useCallback(() => {
    setCaptures([]);
    setAlphabetTemplates({});
    idbClearWorkspace();
    saveTranslateWorkspaceData({
      captures: [],
      alphabetCaptureMap: {},
      alphabetTemplates: {},
    });
    setSelectedCaptureId(null);
  }, []);

  return (
    <WorkspaceLayout fullHeight headerTitle="Word and Alphabet Dataset">
      <div className="flex-1 overflow-hidden p-lg">
        <div className="grid h-full grid-cols-1 gap-lg xl:grid-cols-[1.35fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-primary shadow-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Live camera feed"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            />

            <div className="absolute left-md top-md flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-elevated/80 px-3 py-1.5 backdrop-blur-sm">
              <span className={`h-2 w-2 rounded-full ${isRecording ? "animate-pulse bg-error" : "bg-success"}`} />
              <span className="text-label-sm text-on-surface">
                {isRecording ? "Recording" : cameraReady ? "Live" : "Initializing"}
              </span>
            </div>

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

            <div className="absolute inset-x-0 bottom-0 border-t border-outline-variant/40 bg-surface-primary/85 p-md backdrop-blur-md">
              <div className="mb-sm flex flex-wrap items-center gap-sm">
                <button
                  onClick={() => setMode("static")}
                  className={`rounded-full px-3 py-1.5 text-label-sm ${mode === "static" ? "bg-primary text-on-primary" : "bg-surface-elevated text-on-surface"}`}
                >
                  Static Word (Image)
                </button>
                <button
                  onClick={() => setMode("dynamic")}
                  className={`rounded-full px-3 py-1.5 text-label-sm ${mode === "dynamic" ? "bg-primary text-on-primary" : "bg-surface-elevated text-on-surface"}`}
                >
                  Dynamic Word (Video)
                </button>
                <button
                  onClick={startCamera}
                  className="rounded-full border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface"
                >
                  Restart Camera
                </button>
              </div>

              <div className="flex flex-col gap-sm md:flex-row md:items-center">
                <input
                  value={wordLabel}
                  onChange={(event) => setWordLabel(event.target.value)}
                  placeholder="Type the word or alphabet name to store"
                  className="h-10 flex-1 rounded-lg border border-outline-variant bg-surface-elevated px-3 text-on-surface outline-none focus:border-primary"
                />

                <button
                  onClick={captureStaticImage}
                  disabled={mode !== "static" || isRecording || !wordLabel.trim()}
                  className="h-10 rounded-lg bg-secondary px-4 text-on-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Capture Image
                </button>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={mode !== "dynamic" || !wordLabel.trim()}
                    className="h-10 rounded-lg bg-error px-4 text-on-error disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="h-10 rounded-lg bg-tertiary px-4 text-on-tertiary"
                  >
                    Stop Recording
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-md overflow-y-auto pr-1">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-secondary p-md">
              <div className="mb-sm flex items-center justify-between">
                <h2 className="text-title-lg text-on-surface">Stored Word Library</h2>
                <div className="flex items-center gap-2">
                  <span className="text-label-sm text-on-surface-variant">{captures.length} items</span>
                  {captures.length > 0 && (
                    <button
                      onClick={clearAllCaptures}
                      className="px-2.5 py-1 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-all"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {captures.length === 0 ? (
                <p className="rounded-lg border border-dashed border-outline-variant p-md text-body-sm text-on-surface-variant">
                  No captures yet. Save static image words and dynamic sign videos here.
                </p>
              ) : (
                <div className="max-h-[34vh] space-y-sm overflow-y-auto pr-1">
                  {captures.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-sm ${selectedCaptureId === item.id ? "border-primary bg-primary/10" : "border-outline-variant/40 bg-surface-primary"}`}
                    >
                      <button onClick={() => setSelectedCaptureId(item.id)} className="w-full text-left">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="truncate text-label-md text-on-surface">{item.label}</p>
                          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-label-sm text-on-surface-variant">
                            {item.mode === "static" ? "Static" : `Dynamic ${item.durationSec ?? 0}s`}
                          </span>
                        </div>

                        {item.kind === "image" ? (
                          <img
                            src={item.dataUrl}
                            alt={item.label}
                            className="mb-2 h-28 w-full rounded-md border border-outline-variant/30 object-cover"
                          />
                        ) : (
                          <video
                            src={item.dataUrl}
                            controls
                            className="mb-2 h-28 w-full rounded-md border border-outline-variant/30 object-cover"
                          />
                        )}

                        <p className="text-label-sm text-on-surface-variant">{formatTimestamp(item.createdAt)}</p>
                      </button>
                      <button
                        onClick={() => removeCapture(item.id)}
                        className="mt-2 rounded-md border border-error/30 px-2 py-1 text-label-sm text-error"
                      >
                        Delete
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-outline-variant/40 bg-surface-secondary p-md">
              <div className="mb-sm flex items-center justify-between gap-sm">
                <div>
                  <h2 className="text-title-lg text-on-surface">Named Templates</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    Store each word or alphabet under the name you typed. The live hand pattern is saved with it.
                  </p>
                </div>
                <span className="text-label-sm text-on-surface-variant">{Object.keys(alphabetTemplates).length} templates</span>
              </div>

              <div className="grid grid-cols-1 gap-sm sm:grid-cols-2 xl:grid-cols-3">
                {captures.map((item) => {
                  const hasTemplate = Boolean(alphabetTemplates[item.label]);

                  return (
                    <div key={item.id} className="rounded-lg border border-outline-variant/40 bg-surface-primary p-sm">
                      <div className="mb-1 text-label-md text-primary">{item.label}</div>
                      <p className="text-label-sm text-on-surface-variant">
                        {item.mode === "static" ? "Image capture" : `Video capture · ${item.durationSec ?? 0}s`}
                      </p>
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {hasTemplate ? "Template ready for translate" : "No hand template saved yet"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
