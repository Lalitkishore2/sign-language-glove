import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Trash2, Plus, Info, Save, 
  Download, Upload, HelpCircle, Activity, 
  Check, FileUp, FileDown, RotateCcw, AlertTriangle
} from 'lucide-react';
import WebcamStream from '../components/WebcamStream';
import GloveVisualizer from '../components/GloveVisualizer';
import { isGloveConnected, onGloveData } from '../utils/GloveConnection';
import { 
  classifyGesture, 
  classifySequence, 
  loadCustomTemplates, 
  saveCustomTemplate, 
  clearCustomTemplates,
  resampleSequence
} from '../utils/SignClassifier';

export default function Trainer() {
  const [customTemplates, setCustomTemplates] = useState({});
  const [gestureName, setGestureName] = useState("");
  const [gestureType, setGestureType] = useState("static"); // "static" or "dynamic"
  
  // Input source
  const [inputSource, setInputSource] = useState(isGloveConnected() ? "glove" : "webcam");
  const [gloveData, setGloveData] = useState({ flex: [0,0,0,0,0], roll: 0, pitch: 0, gesture: '', confidence: 0 });
  const gloveDataRef = useRef(gloveData);
  const inputSourceRef = useRef(inputSource);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  
  // Sandbox states
  const [prediction, setPrediction] = useState("No Sign Detected");
  const [confidence, setConfidence] = useState(0);
  const [isDynamicPrediction, setIsDynamicPrediction] = useState(false);

  // File import/export messages
  const [systemMessage, setSystemMessage] = useState(null);

  // Refs for tracking streaming frames
  const webcamBufferRef = useRef([]);
  const recordingBufferRef = useRef([]);
  const currentNormalizedRef = useRef(null);
  const countdownRef = useRef(0);
  const isRecordingRef = useRef(false);
  
  const timerRef = useRef(null);

  // Sync refs
  useEffect(() => { inputSourceRef.current = inputSource; }, [inputSource]);
  useEffect(() => { gloveDataRef.current = gloveData; }, [gloveData]);
  useEffect(() => { countdownRef.current = countdown; }, [countdown]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // Glove data listener
  useEffect(() => {
    onGloveData((data) => {
      if (inputSourceRef.current === 'glove') {
        setGloveData(data);
        
        // Live prediction in sandbox (when not recording)
        if (!isRecordingRef.current) {
          if (data.gesture && data.gesture !== "") {
            setPrediction(data.gesture);
            setConfidence(data.confidence);
            setIsDynamicPrediction(false);
          } else {
            setPrediction("No Sign Detected");
            setConfidence(0);
          }
        }
      }
    });
  }, []);

  // Load custom templates
  const refreshTemplates = () => {
    setCustomTemplates(loadCustomTemplates());
  };

  useEffect(() => {
    refreshTemplates();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Show status alerts that auto-dismiss
  const triggerMessage = (text, type = "success") => {
    setSystemMessage({ text, type });
    setTimeout(() => {
      setSystemMessage(null);
    }, 4000);
  };

  // Callback from WebcamStream
  const handleHandLandmarks = (rawLandmarks, normalizedFeatures, handedness) => {
    if (inputSource !== 'webcam') return;
    currentNormalizedRef.current = normalizedFeatures;

    if (!normalizedFeatures) {
      if (webcamBufferRef.current.length > 0) {
        webcamBufferRef.current.shift();
      }
      if (!isRecordingRef.current) {
        setPrediction("No Hand Detected");
        setConfidence(0);
        setIsDynamicPrediction(false);
      }
      return;
    }

    // 1. Maintain sliding window of frames for dynamic matching
    webcamBufferRef.current.push(normalizedFeatures);
    if (webcamBufferRef.current.length > 60) {
      webcamBufferRef.current.shift();
    }

    // 2. Accumulate frames if actively recording a dynamic gesture
    if (isRecordingRef.current && countdownRef.current === 0) {
      recordingBufferRef.current.push(normalizedFeatures);
      
      const maxFrames = 45;
      const progress = Math.min(100, (recordingBufferRef.current.length / maxFrames) * 100);
      setRecordingProgress(Math.round(progress));

      if (recordingBufferRef.current.length >= maxFrames) {
        finishDynamicRecording();
      }
      return;
    }

    // 3. Regular prediction sandbox
    if (!isRecordingRef.current) {
      const dynamicResult = classifySequence(webcamBufferRef.current, customTemplates);
      if (dynamicResult.label !== "Unknown" && dynamicResult.confidence > 50) {
        setPrediction(dynamicResult.label);
        setConfidence(dynamicResult.confidence);
        setIsDynamicPrediction(true);
      } else {
        const staticResult = classifyGesture(normalizedFeatures, customTemplates);
        setPrediction(staticResult.label);
        setConfidence(staticResult.confidence);
        setIsDynamicPrediction(false);
      }
    }
  };

  // Trigger Static Pose Capture
  const handleCaptureStatic = () => {
    if (!gestureName.trim()) {
      triggerMessage("Please enter a name for your sign first.", "error");
      return;
    }

    if (inputSource === 'glove') {
      // Save glove sensor data as a custom glove template
      const gd = gloveDataRef.current;
      const gloveTemplate = {
        flex: [...gd.flex],
        roll: gd.roll,
        pitch: gd.pitch
      };
      
      try {
        const saved = localStorage.getItem('isl_custom_glove_templates');
        const current = saved ? JSON.parse(saved) : {};
        current[gestureName.trim()] = gloveTemplate;
        localStorage.setItem('isl_custom_glove_templates', JSON.stringify(current));
        triggerMessage(`Saved glove sign: "${gestureName}" (Flex: [${gd.flex.join(', ')}], Roll: ${gd.roll.toFixed(1)}°, Pitch: ${gd.pitch.toFixed(1)}°)`);
        setGestureName("");
        refreshTemplates();
      } catch (e) {
        triggerMessage("Failed to save glove template.", "error");
      }
      return;
    }

    // Webcam mode
    if (!currentNormalizedRef.current) {
      triggerMessage("No hands detected in camera frame. Hold pose and try again.", "error");
      return;
    }

    const success = saveCustomTemplate(
      gestureName.trim(), 
      currentNormalizedRef.current, 
      "static", 
      1
    );

    if (success) {
      triggerMessage(`Successfully saved static sign: "${gestureName}"`);
      setGestureName("");
      refreshTemplates();
    } else {
      triggerMessage("Failed to save template.", "error");
    }
  };

  // Trigger Dynamic Gesture Recording (Start countdown)
  const handleStartDynamicRecording = () => {
    if (!gestureName.trim()) {
      triggerMessage("Please enter a name for your sign first.", "error");
      return;
    }
    
    recordingBufferRef.current = [];
    setRecordingProgress(0);
    setIsRecording(true);
    setCountdown(3);

    let count = 3;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  };

  // Auto-finish when recording buffer reaches max size
  const finishDynamicRecording = () => {
    setIsRecording(false);
    const rawFrames = recordingBufferRef.current;
    
    if (rawFrames.length < 10) {
      triggerMessage("Recording was too short or unstable. Try again.", "error");
      return;
    }

    const resampled = resampleSequence(rawFrames, 10);
    const success = saveCustomTemplate(
      gestureName.trim(),
      resampled,
      "dynamic",
      rawFrames.length
    );

    if (success) {
      triggerMessage(`Successfully saved dynamic sign: "${gestureName}" (${rawFrames.length} frames)`);
      setGestureName("");
      refreshTemplates();
    } else {
      triggerMessage("Failed to save template.", "error");
    }
  };

  // Cancel active recording
  const handleCancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setCountdown(0);
    recordingBufferRef.current = [];
    setRecordingProgress(0);
    triggerMessage("Recording cancelled.", "info");
  };

  // Delete Template
  const handleDeleteTemplate = (label) => {
    try {
      const saved = localStorage.getItem('isl_custom_templates');
      if (saved) {
        const custom = JSON.parse(saved);
        delete custom[label];
        localStorage.setItem('isl_custom_templates', JSON.stringify(custom));
      }
      // Also try deleting from glove templates
      const gloveSaved = localStorage.getItem('isl_custom_glove_templates');
      if (gloveSaved) {
        const gloveCustom = JSON.parse(gloveSaved);
        delete gloveCustom[label];
        localStorage.setItem('isl_custom_glove_templates', JSON.stringify(gloveCustom));
      }
      refreshTemplates();
      triggerMessage(`Deleted gesture: "${label}"`);
    } catch (e) {
      console.error(e);
      triggerMessage("Failed to delete gesture.", "error");
    }
  };

  // Clear all custom templates
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all custom recorded signs? This cannot be undone.")) {
      clearCustomTemplates();
      localStorage.removeItem('isl_custom_glove_templates');
      refreshTemplates();
      triggerMessage("Cleared all custom signs.");
    }
  };

  // Export templates as JSON file
  const handleExportJSON = () => {
    try {
      const webcamSaved = localStorage.getItem('isl_custom_templates') || "{}";
      const gloveSaved = localStorage.getItem('isl_custom_glove_templates') || "{}";
      const exportData = { webcam: JSON.parse(webcamSaved), glove: JSON.parse(gloveSaved) };
      
      if (Object.keys(exportData.webcam).length === 0 && Object.keys(exportData.glove).length === 0) {
        triggerMessage("No custom signs to export.", "error");
        return;
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ishaara_custom_signs_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerMessage("Custom signs exported successfully.");
    } catch (e) {
      console.error(e);
      triggerMessage("Failed to export.", "error");
    }
  };

  // Import templates from JSON file
  const handleImportJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Handle both old format (flat) and new format (webcam/glove)
        if (importedData.webcam || importedData.glove) {
          if (importedData.webcam) {
            const saved = localStorage.getItem('isl_custom_templates');
            const current = saved ? JSON.parse(saved) : {};
            localStorage.setItem('isl_custom_templates', JSON.stringify({ ...current, ...importedData.webcam }));
          }
          if (importedData.glove) {
            const saved = localStorage.getItem('isl_custom_glove_templates');
            const current = saved ? JSON.parse(saved) : {};
            localStorage.setItem('isl_custom_glove_templates', JSON.stringify({ ...current, ...importedData.glove }));
          }
        } else {
          // Old flat format — treat as webcam templates
          const saved = localStorage.getItem('isl_custom_templates');
          const current = saved ? JSON.parse(saved) : {};
          localStorage.setItem('isl_custom_templates', JSON.stringify({ ...current, ...importedData }));
        }
        
        refreshTemplates();
        triggerMessage("Custom signs imported & merged successfully!");
      } catch (err) {
        console.error(err);
        triggerMessage("Invalid JSON file formatting.", "error");
      }
    };
    reader.readAsText(file);
  };

  // Get all templates (webcam + glove) for display
  const getAllTemplates = () => {
    const webcamTemplates = { ...customTemplates };
    try {
      const gloveSaved = localStorage.getItem('isl_custom_glove_templates');
      if (gloveSaved) {
        const gloveTemplates = JSON.parse(gloveSaved);
        Object.entries(gloveTemplates).forEach(([key, val]) => {
          webcamTemplates[key] = { ...val, type: 'glove' };
        });
      }
    } catch (e) { /* ignore */ }
    return webcamTemplates;
  };

  const allTemplates = getAllTemplates();

  return (
    <div className="page-container">
      <h2 className="gradient-title">AI Gesture Training Studio</h2>
      <p className="page-subtitle">
        Teach Ishaara custom signs! Use the webcam for hand landmark capture or the glove for sensor-based gesture training.
      </p>

      {/* Floating System Alerts */}
      {systemMessage && (
        <div 
          className={`glass-card alert-toast ${systemMessage.type}`} 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: systemMessage.type === 'error' ? '1px solid var(--error)' : '1px solid var(--success)',
            background: 'rgba(9, 9, 14, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'pulse-slow 2s infinite'
          }}
        >
          {systemMessage.type === 'error' ? <AlertTriangle size={20} style={{ color: 'var(--error)' }} /> : <Check size={20} style={{ color: 'var(--success)' }} />}
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{systemMessage.text}</span>
        </div>
      )}

      <div className="practice-layout" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
        {/* Left column: Setup and Recording Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Define Gesture */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Plus className="text-glow" size={20} />
              <span>Create New Sign Definition</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Gesture Label (Word or Phrase)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Namaste, Thank You, Wave, Letter Z"
                  value={gestureName}
                  onChange={(e) => setGestureName(e.target.value)}
                  disabled={isRecording}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {inputSource === 'webcam' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Gesture Type
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => setGestureType("static")}
                      disabled={isRecording}
                      className={`btn ${gestureType === "static" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      <strong>Static Pose</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, marginTop: '0.1rem', opacity: 0.8 }}>
                        Single frame hand shape (e.g. letters)
                      </span>
                    </button>
                    <button
                      onClick={() => setGestureType("dynamic")}
                      disabled={isRecording}
                      className={`btn ${gestureType === "dynamic" ? "btn-primary" : "btn-secondary"}`}
                      style={{ flex: 1, padding: '0.75rem' }}
                    >
                      <strong>Dynamic Movement</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, marginTop: '0.1rem', opacity: 0.8 }}>
                        Motion over 1.5 seconds (e.g. waving)
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Capture Console */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity className="text-glow" size={20} />
              <span>Capture Console</span>
            </h3>

            {isRecording ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--primary-glow)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                {countdown > 0 ? (
                  <div>
                    <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Get Ready...</h4>
                    <div style={{
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      textShadow: '0 0 20px var(--primary-glow)',
                      margin: '1rem 0'
                    }}>
                      {countdown}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Position your hand(s) in the frame and prepare to make the movement!
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--success)', marginBottom: '0.5rem', animation: 'pulse-slow 1s infinite' }}>
                      🔴 RECORDING MOVEMENT...
                    </h4>
                    
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', margin: '1.5rem 0 0.5rem 0' }}>
                      <div style={{
                        width: `${recordingProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                        transition: 'width 0.05s linear'
                      }} />
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Perform the action clearly in front of the lens.
                    </p>
                  </div>
                )}

                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancelRecording}
                  style={{ marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                >
                  Cancel Recording
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {inputSource === 'glove'
                    ? 'Hold the glove in the desired pose and click "Capture Glove Snapshot" to save the current sensor readings as a template.'
                    : gestureType === 'static' 
                      ? 'Align your hand pose in the camera stream and click "Capture Frame" to save the template.'
                      : 'Click "Record Sequence" to begin a countdown, followed by a 1.5-second capture of your hand movement.'
                  }
                </p>

                {inputSource === 'glove' ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCaptureStatic}
                    disabled={!gestureName.trim()}
                    style={{ width: '100%', padding: '0.9rem' }}
                  >
                    <Save size={18} />
                    <span>Capture Glove Snapshot</span>
                  </button>
                ) : gestureType === 'static' ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleCaptureStatic}
                    disabled={!gestureName.trim()}
                    style={{ width: '100%', padding: '0.9rem' }}
                  >
                    <Save size={18} />
                    <span>Capture Frame Snapshot</span>
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleStartDynamicRecording}
                    disabled={!gestureName.trim()}
                    style={{ width: '100%', padding: '0.9rem' }}
                  >
                    <Sparkles size={18} />
                    <span>Record Sequence</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Manage Gestures & Backups */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} className="text-glow" />
                <span>Saved Custom Gestures ({Object.keys(allTemplates).length})</span>
              </h3>
              
              {Object.keys(allTemplates).length > 0 && (
                <button 
                  onClick={handleClearAll} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {Object.keys(allTemplates).length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No custom signs trained yet. Start by defining one above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {Object.entries(allTemplates).map(([label, tpl]) => (
                  <div 
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        marginLeft: '0.5rem',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '10px',
                        background: tpl.type === 'glove' ? 'rgba(16, 185, 129, 0.15)' : tpl.type === 'dynamic' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                        color: tpl.type === 'glove' ? 'var(--success)' : tpl.type === 'dynamic' ? 'var(--secondary)' : 'var(--primary)',
                        fontWeight: 700
                      }}>
                        {tpl.type === 'glove' ? 'Glove' : tpl.type === 'dynamic' ? `Dynamic (${tpl.originalLength}f)` : 'Static'}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteTemplate(label)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Backups Panel */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={handleExportJSON}
                className="btn btn-secondary"
                disabled={Object.keys(allTemplates).length === 0}
                style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.8rem', gap: '0.35rem' }}
              >
                <FileDown size={14} />
                <span>Export Backup</span>
              </button>
              
              <label 
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.8rem', gap: '0.35rem', cursor: 'pointer', textAlign: 'center', justifyContent: 'center' }}
              >
                <FileUp size={14} />
                <span>Import Backup</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>

        </div>

        {/* Right column: Camera/Glove Stream & Sandbox Testing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Input Source Toggle */}
          <div style={{ display: 'flex', gap: '1rem' }}>
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
                  alert("Please connect the glove from the Home page first.");
                  return;
                }
                setInputSource('glove');
              }}
              style={{ flex: 1 }}
            >
              Glove Sensor
            </button>
          </div>

          {/* Camera/Glove Feed */}
          <div className="camera-card-container">
            {inputSource === 'webcam' ? (
              <WebcamStream onHandLandmarks={handleHandLandmarks} />
            ) : (
              <div style={{ height: '400px' }}>
                <GloveVisualizer flex={gloveData.flex} roll={gloveData.roll} pitch={gloveData.pitch} />
              </div>
            )}
          </div>

          {/* Sandbox Live Tester */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles className="text-glow" size={20} />
                <span>Live Tester Sandbox</span>
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-predict is live</span>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {confidence > 0 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isDynamicPrediction 
                    ? 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
              )}

              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Currently Recognized Sign
              </span>
              
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                background: isDynamicPrediction 
                  ? 'linear-gradient(to right, #fff, var(--secondary))'
                  : 'linear-gradient(to right, #fff, var(--primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0.5rem 0'
              }}>
                {prediction}
              </div>

              {confidence > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Match Confidence: <span style={{ color: isDynamicPrediction ? 'var(--secondary)' : 'var(--primary)', fontWeight: 700 }}>{confidence}%</span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: inputSource === 'glove' ? 'var(--success)' : isDynamicPrediction ? 'var(--secondary)' : 'var(--primary)',
                    background: inputSource === 'glove' ? 'rgba(16, 185, 129, 0.1)' : isDynamicPrediction ? 'rgba(6, 182, 212, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {inputSource === 'glove' ? 'Glove Sensor Match' : isDynamicPrediction ? 'Dynamic Motion Match' : 'Static Shape Match'}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {inputSource === 'glove' ? 'Make a gesture with the glove to test recognition.' : 'Show a custom pose or repeat a dynamic gesture to test recognition.'}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <HelpCircle size={16} className="text-glow" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Tip:</strong> {inputSource === 'glove' 
                  ? 'In Glove mode, capture saves the current flex sensor values, roll, and pitch as a template. The ESP32 handles gesture recognition natively.'
                  : 'Skeletons are color-coded! Custom gestures are stored locally in your browser cache.'
                }
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
