import React, { useEffect, useRef, useState } from 'react';
import { Camera as CameraIcon, VideoOff } from 'lucide-react';
import { normalizeLandmarks, normalizeTwoHands } from '../utils/SignClassifier';

export default function WebcamStream({ onHandLandmarks }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const handsRef = useRef(null);

  // Connection mapping for hand drawing
  const CONNECTIONS = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [9, 10], [10, 11], [11, 12],
    // Ring finger
    [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm connections
    [5, 9], [9, 13], [13, 17]
  ];

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (e) {
        console.error("Error closing MediaPipe hands", e);
      }
      handsRef.current = null;
    }
    setIsActive(false);
    setLoading(false);
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startCamera = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Dynamic import of MediaPipe Hands
      const mpHands = await import('@mediapipe/hands');
      
      // Resolve Hands from window or imports
      const Hands = window.Hands || 
                    mpHands.Hands || 
                    (mpHands.default && mpHands.default.Hands);

      if (!Hands) {
        throw new Error("MediaPipe Hands constructor not found. Please refresh or check CDN accessibility.");
      }

      if (!videoRef.current) return;

      // 2. Initialize MediaPipe Hands
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          // Normalize two hands
          const normalized = normalizeTwoHands(results.multiHandLandmarks, results.multiHandedness);
          
          // Send raw landmarks, normalized features, and handedness to parent
          onHandLandmarks(results.multiHandLandmarks, normalized, results.multiHandedness);

          // Draw the hand overlay in neon-glow style for each hand
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const handedness = results.multiHandedness && results.multiHandedness[i];
            const label = handedness?.label || handedness?.categoryName || 'left';
            drawHand(ctx, landmarks, canvas.width, canvas.height, label);
          }
        } else {
          // No hand detected
          onHandLandmarks(null, null, null);
        }
      });

      handsRef.current = hands;

      // 3. Request webcam stream using browser HTML5 API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported or insecure HTTP context. Please open the app in localhost or HTTPS.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      
      // Wait for metadata to load before playing
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => resolve();
      });

      await videoRef.current.play();
      
      setIsActive(true);
      setLoading(false);

      // 4. Start browser requestAnimationFrame loop
      let processing = false;
      const processFrame = async () => {
        if (!handsRef.current || !videoRef.current || videoRef.current.paused) return;

        if (!processing && videoRef.current.readyState >= 2) {
          processing = true;
          try {
            await handsRef.current.send({ image: videoRef.current });
          } catch (e) {
            console.error("Frame process error", e);
          }
          processing = false;
        }
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      };

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error("Error accessing camera / initializing MediaPipe", err);
      setError(err.message || "Unable to access camera. Please check permissions.");
      stopCamera();
    }
  };

  const drawHand = (ctx, landmarks, width, height, handLabel = 'left') => {
    // Enable glowing neon lines
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;

    const isLeft = handLabel.toLowerCase() === 'left';
    // Left Hand = Cyan (#06b6d4), Right Hand = Magenta/Fuchsia (#d946ef)
    const strokeColor = isLeft ? '#06b6d4' : '#d946ef';
    const pointColor = '#ffffff';
    const tipColor = isLeft ? '#a78bfa' : '#fda4af'; // light purple vs light pink
    const shadowColor = strokeColor;

    // Draw bones/connections
    CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const pt1 = landmarks[startIdx];
      const pt2 = landmarks[endIdx];
      
      // Interpolate connecting lines
      ctx.beginPath();
      ctx.moveTo(pt1.x * width, pt1.y * height);
      ctx.lineTo(pt2.x * width, pt2.y * height);
      
      // Neon color gradient
      ctx.strokeStyle = strokeColor;
      ctx.shadowColor = shadowColor;
      ctx.stroke();
    });

    // Draw joints/landmarks
    ctx.shadowBlur = 12;
    for (let i = 0; i < 21; i++) {
      const pt = landmarks[i];
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, 4.5, 0, 2 * Math.PI);
      
      // Highlight fingertips (4, 8, 12, 16, 20)
      const isFingertip = [4, 8, 12, 16, 20].includes(i);
      ctx.fillStyle = isFingertip ? tipColor : pointColor;
      ctx.shadowColor = isFingertip ? tipColor : shadowColor;
      ctx.fill();
    }
    
    // Reset shadow for next frame drawing
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    // Auto-start camera on mount
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="glass-card video-card">
      <video
        ref={videoRef}
        className="webcam-feed"
        playsInline
        muted
        style={{ display: isActive ? 'block' : 'none' }}
      />
      <canvas
        ref={canvasRef}
        className="overlay-canvas"
        width={640}
        height={360}
        style={{ display: isActive ? 'block' : 'none' }}
      />

      {!isActive && (
        <div className="video-placeholder" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="camera-button" onClick={startCamera}>
            {loading ? (
              <div className="spinner" style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'pulse-slow 1s infinite linear'
              }} />
            ) : (
              <CameraIcon size={28} />
            )}
          </div>
          <h3 style={{ marginTop: '1rem' }}>{loading ? 'Initializing AI Engine...' : 'Camera Offline'}</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '320px', marginTop: '0.5rem' }}>
            {error || 'Click the button above to enable your camera and begin tracking.'}
          </p>
        </div>
      )}

      {isActive && (
        <button 
          className="btn btn-secondary" 
          onClick={stopCamera}
          style={{ position: 'absolute', bottom: '1rem', right: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <VideoOff size={16} />
          <span>Stop Camera</span>
        </button>
      )}
    </div>
  );
}
