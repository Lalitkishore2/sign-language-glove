import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Trash2, Space as SpaceIcon, Info } from 'lucide-react';
import WebcamStream from '../components/WebcamStream';
import GloveVisualizer from '../components/GloveVisualizer';
import { isGloveConnected, onGloveData } from '../utils/GloveConnection';
import { classifyGesture, loadCustomTemplates } from '../utils/SignClassifier';

export default function Translator() {
  const [prediction, setPrediction] = useState("No Hand Detected");
  const [confidence, setConfidence] = useState(0);
  const [sentence, setSentence] = useState("");
  const [customTemplates, setCustomTemplates] = useState({});

  const [inputSource, setInputSource] = useState(isGloveConnected() ? "glove" : "webcam");
  const [gloveData, setGloveData] = useState({ flex: [0,0,0,0,0], roll: 0, pitch: 0 });
  const inputSourceRef = useRef(inputSource);

  useEffect(() => {
    inputSourceRef.current = inputSource;
  }, [inputSource]);

  useEffect(() => {
    onGloveData((data) => {
      if (inputSourceRef.current === 'glove') {
        setGloveData(data);
        if (data.gesture && data.gesture !== "") {
          setPrediction(data.gesture);
          setConfidence(data.confidence);
          
          if (data.gesture === lastStablePrediction.current) {
            stableDurationCount.current += 1;
            if (stableDurationCount.current === 10) { // 10 packets @ 10Hz = 1s
              appendGestureToSentence(data.gesture);
            }
          } else {
            lastStablePrediction.current = data.gesture;
            stableDurationCount.current = 0;
          }
        } else {
          setPrediction("No Sign Detected");
          setConfidence(0);
          stableDurationCount.current = 0;
        }
      }
    });
  }, []);

  // Prediction smoothing and stable word/char appending
  const predictionHistory = useRef([]);
  const lastStablePrediction = useRef("");
  const stableDurationCount = useRef(0);

  // Speech Synthesis
  const speakSentence = () => {
    if (!sentence.trim()) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(sentence);
    synth.speak(utterance);
  };

  // Reload custom templates from localStorage
  const refreshTemplates = () => {
    setCustomTemplates(loadCustomTemplates());
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const handleHandLandmarks = (rawLandmarks, normalizedFeatures) => {
    if (inputSource !== 'webcam') return;
    
    if (!normalizedFeatures) {
      setPrediction("No Hand Detected");
      setConfidence(0);
      predictionHistory.current = [];
      stableDurationCount.current = 0;
      return;
    }

    // 1. Run Classification
    const result = classifyGesture(normalizedFeatures, customTemplates);
    
    // 2. Add to smoothing history
    predictionHistory.current.push(result.label);
    if (predictionHistory.current.length > 8) {
      predictionHistory.current.shift();
    }

    // 3. Find most frequent prediction (Mode)
    const counts = {};
    let maxCount = 0;
    let smoothedLabel = "Unknown";
    
    predictionHistory.current.forEach((val) => {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        smoothedLabel = val;
      }
    });

    setPrediction(smoothedLabel);
    setConfidence(result.confidence);

    // 4. Stable Gesture detection for Sentence Building (must hold for 20 frames / approx 1 sec)
    if (smoothedLabel !== "Unknown" && smoothedLabel !== "No Hand") {
      if (smoothedLabel === lastStablePrediction.current) {
        stableDurationCount.current += 1;
        
        // Trigger word append on threshold
        if (stableDurationCount.current === 25) {
          appendGestureToSentence(smoothedLabel);
        }
      } else {
        lastStablePrediction.current = smoothedLabel;
        stableDurationCount.current = 0;
      }
    } else {
      stableDurationCount.current = 0;
    }
  };

  const appendGestureToSentence = (gestureLabel) => {
    // Standard labels to simplified text
    let toAppend = "";
    if (gestureLabel === "Closed Fist") {
      // Don't auto-append fist (rest state)
      return;
    } else if (gestureLabel === "Open Hand") {
      // Space
      toAppend = " ";
    } else if (gestureLabel === "Pointing") {
      toAppend = "1";
    } else if (gestureLabel === "Victory (V)") {
      toAppend = "V";
    } else {
      toAppend = gestureLabel;
    }

    setSentence((prev) => {
      // Avoid repeating space or duplicate letters consecutively
      if (toAppend === " " && prev.endsWith(" ")) return prev;
      return prev + toAppend;
    });

    // Provide a subtle haptic or visual indicator
    const feedbackBox = document.getElementById("main-prediction-box");
    if (feedbackBox) {
      feedbackBox.classList.add("pulse-glow");
      setTimeout(() => feedbackBox.classList.remove("pulse-glow"), 500);
    }
  };

  return (
    <div className="page-container">
      <h2 className="gradient-title">Real-Time Sign Translator</h2>
      <p className="page-subtitle">
        Translate signs instantly. Hold your hand steady for 1.5 seconds to build words and sentences automatically.
      </p>

      <div className="translator-layout">
        {/* Left: Live Stream */}
        <div className="stream-section">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              className={`btn ${inputSource === 'webcam' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setInputSource('webcam')}
              style={{ flex: 1 }}
            >
              Webcam Feed
            </button>
            <button 
              className={`btn ${inputSource === 'glove' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                if (!isGloveConnected()) {
                  alert("Please connect the glove from the Home page or Navbar first.");
                  return;
                }
                setInputSource('glove');
              }}
              style={{ flex: 1 }}
            >
              Glove Sensor
            </button>
          </div>

          {inputSource === 'webcam' ? (
            <WebcamStream onHandLandmarks={handleHandLandmarks} />
          ) : (
            <div style={{ height: '480px' }}>
              <GloveVisualizer flex={gloveData.flex} roll={gloveData.roll} pitch={gloveData.pitch} />
            </div>
          )}
        </div>

        {/* Right: Controls & Translation Output */}
        <div className="controls-section">
          <div className="glass-card controls-card">
            
            {/* Live Prediction Display */}
            <div id="main-prediction-box" className="active-gesture-box">
              <span className="prediction-label">Current Sign</span>
              <div className="main-prediction">
                {prediction}
              </div>
              {confidence > 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Match Confidence: <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{confidence}%</span>
                </div>
              )}
            </div>

            {/* Sentence Builder */}
            <div className="sentence-builder-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="prediction-label">Translated Sentence</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-append is active</span>
              </div>
              <textarea
                className="sentence-textarea"
                value={sentence}
                onChange={(e) => setSentence(e.target.value)}
                placeholder="Translated text will appear here..."
              />
              
              <div className="action-bar">
                <button 
                  className="action-btn action-btn-primary"
                  onClick={speakSentence}
                  disabled={!sentence.trim()}
                >
                  <Volume2 size={18} />
                  <span>Speak</span>
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setSentence((prev) => prev + " ")}
                >
                  <SpaceIcon size={18} />
                  <span>Space</span>
                </button>
                <button 
                  className="action-btn"
                  onClick={() => setSentence("")}
                  disabled={!sentence}
                >
                  <Trash2 size={18} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Information Tips */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Info size={16} className="text-glow" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>How to use:</strong> Open your hand completely for Space. Make a closed fist to pause translation. Use Victory or Pointing gestures for digits/signs. Record your own letters under the custom menu.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
