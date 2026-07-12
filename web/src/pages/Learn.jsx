import React, { useState, useEffect, useRef } from 'react';
import { Award, ArrowRight, CheckCircle2, RefreshCw, HelpCircle, Camera, Radio } from 'lucide-react';
import WebcamStream from '../components/WebcamStream';
import GloveVisualizer from '../components/GloveVisualizer';
import { isGloveConnected, onGloveData } from '../utils/GloveConnection';
import { DEFAULT_TEMPLATES, classifyGesture } from '../utils/SignClassifier';
import { WEBCAM_ISL_GESTURES, GLOVE_ISL_GESTURES } from '../utils/ISLGestureLibrary';

// ============================================================
// TARGET SENSOR BAR COMPONENT (for glove practice reference)
// ============================================================
function TargetSensorBars({ gesture, liveData }) {
  const fingers = ['thumb', 'index', 'middle', 'ring', 'little'];
  const labels = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Target Sensor Values
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', gap: '0.5rem' }}>
        {fingers.map((finger, idx) => {
          const target = gesture.flex[finger];
          const live = liveData ? liveData.flex[idx] : 0;
          const isClose = Math.abs(target - live) <= gesture.flexTolerance;
          
          return (
            <div key={finger} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
              <div style={{ 
                width: '100%', 
                height: '60px', 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: '6px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--border-glass)'
              }}>
                {/* Target zone */}
                <div style={{
                  position: 'absolute',
                  bottom: `${Math.max(0, target - gesture.flexTolerance)}%`,
                  left: 0, right: 0,
                  height: `${gesture.flexTolerance * 2}%`,
                  background: 'rgba(139, 92, 246, 0.15)',
                  borderTop: '1px dashed var(--primary)',
                  borderBottom: '1px dashed var(--primary)'
                }} />
                {/* Live value */}
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: '25%', right: '25%',
                  height: `${live}%`,
                  background: isClose ? 'var(--success)' : 'var(--error)',
                  transition: 'height 0.1s ease',
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.8
                }} />
              </div>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{labels[idx]}</span>
              <span style={{ fontSize: '0.55rem', color: isClose ? 'var(--success)' : 'var(--text-muted)' }}>
                {live}/{target}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Roll/Pitch targets */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Roll: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{gesture.roll.min}° to {gesture.roll.max}°</span>
          {liveData && <span style={{ color: 'var(--text-muted)' }}> (now: {liveData.roll.toFixed(0)}°)</span>}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Pitch: <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{gesture.pitch.min}° to {gesture.pitch.max}°</span>
          {liveData && <span style={{ color: 'var(--text-muted)' }}> (now: {liveData.pitch.toFixed(0)}°)</span>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HAND POSITION SVG (for webcam practice reference)
// ============================================================
function HandPositionSVG({ gestureId }) {
  // Simple SVG wireframe variations for different hand poses
  const getFingerPaths = () => {
    switch (gestureId) {
      case 'NAMASTE':
      case 'HELLO':
      case 'PLEASE':
        // All fingers extended
        return (
          <>
            <path d="M 50 90 Q 25 80 20 70 T 15 55" stroke="var(--primary)" />
            <path d="M 50 90 Q 38 60 38 45 T 38 20" stroke="var(--secondary)" />
            <path d="M 50 90 Q 50 55 50 40 T 50 15" stroke="var(--primary)" />
            <path d="M 50 90 Q 62 60 62 45 T 62 20" stroke="var(--secondary)" />
            <path d="M 50 90 Q 75 80 78 70 T 82 55" stroke="var(--primary)" />
          </>
        );
      case 'YES':
      case 'SORRY':
        // Closed fist
        return (
          <>
            <path d="M 50 90 Q 35 80 35 70 T 38 62" stroke="var(--primary)" />
            <path d="M 50 90 Q 42 75 42 67 T 44 58" stroke="var(--secondary)" />
            <path d="M 50 90 Q 50 73 50 65 T 50 55" stroke="var(--primary)" />
            <path d="M 50 90 Q 58 75 58 67 T 56 58" stroke="var(--secondary)" />
            <path d="M 50 90 Q 65 80 65 72 T 63 63" stroke="var(--primary)" />
          </>
        );
      case 'NO':
        // Two fingers extended (index + middle)
        return (
          <>
            <path d="M 50 90 Q 35 83 35 75 T 38 68" stroke="rgba(255,255,255,0.1)" />
            <path d="M 50 90 Q 42 60 42 45 T 42 20" stroke="var(--secondary)" />
            <path d="M 50 90 Q 50 55 50 40 T 50 15" stroke="var(--primary)" />
            <path d="M 50 90 Q 58 78 58 70 T 56 63" stroke="rgba(255,255,255,0.1)" />
            <path d="M 50 90 Q 65 82 65 75 T 63 68" stroke="rgba(255,255,255,0.1)" />
          </>
        );
      case 'GOOD':
        // Thumbs up
        return (
          <>
            <path d="M 50 90 Q 25 75 20 60 T 18 40" stroke="var(--primary)" strokeWidth="2.5" />
            <path d="M 50 90 Q 42 78 42 72 T 44 65" stroke="rgba(255,255,255,0.1)" />
            <path d="M 50 90 Q 50 77 50 70 T 50 63" stroke="rgba(255,255,255,0.1)" />
            <path d="M 50 90 Q 58 78 58 72 T 56 65" stroke="rgba(255,255,255,0.1)" />
            <path d="M 50 90 Q 65 82 65 76 T 63 70" stroke="rgba(255,255,255,0.1)" />
          </>
        );
      default:
        return (
          <>
            <path d="M 50 90 Q 25 80 20 70 T 15 55" stroke="var(--primary)" />
            <path d="M 50 90 Q 38 60 38 45 T 38 20" stroke="var(--secondary)" />
            <path d="M 50 90 Q 50 55 50 40 T 50 15" stroke="var(--primary)" />
            <path d="M 50 90 Q 62 60 62 45 T 62 20" stroke="var(--secondary)" />
            <path d="M 50 90 Q 75 80 78 70 T 82 55" stroke="var(--primary)" />
          </>
        );
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid var(--border-glass)'
    }}>
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none" strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.4))' }}
      >
        <circle cx="50" cy="90" r="2" fill="var(--secondary)" />
        {getFingerPaths()}
      </svg>
    </div>
  );
}

// ============================================================
// MAIN LEARN COMPONENT
// ============================================================
export default function Learn() {
  const [practiceMode, setPracticeMode] = useState('webcam'); // 'webcam' or 'glove'
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedWebcam, setCompletedWebcam] = useState({});
  const [completedGlove, setCompletedGlove] = useState({});
  const [gloveData, setGloveData] = useState({ flex: [0,0,0,0,0], roll: 0, pitch: 0 });

  const successDuration = useRef(0);
  const practiceModeRef = useRef(practiceMode);
  const activeCardIdxRef = useRef(activeCardIdx);
  const isSuccessRef = useRef(isSuccess);

  const currentCards = practiceMode === 'webcam' ? WEBCAM_ISL_GESTURES : GLOVE_ISL_GESTURES;
  const activeCard = currentCards[activeCardIdx] || currentCards[0];
  const completedList = practiceMode === 'webcam' ? completedWebcam : completedGlove;

  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);
  useEffect(() => { activeCardIdxRef.current = activeCardIdx; }, [activeCardIdx]);
  useEffect(() => { isSuccessRef.current = isSuccess; }, [isSuccess]);

  // Glove data listener
  useEffect(() => {
    onGloveData((data) => {
      if (practiceModeRef.current === 'glove') {
        setGloveData(data);
        if (isSuccessRef.current) return;
        
        const currentCard = GLOVE_ISL_GESTURES[activeCardIdxRef.current];
        if (!currentCard) return;

        let scorePercentage = 0;
        if (data.gesture === currentCard.id && data.confidence > 0) {
          scorePercentage = data.confidence;
        }

        setMatchScore(scorePercentage);
        if (scorePercentage >= 82) {
          successDuration.current += 1;
          if (successDuration.current >= 10) {
            handleSuccess();
          }
        } else {
          successDuration.current = 0;
        }
      }
    });
  }, []);

  const handleHandLandmarks = (rawLandmarks, normalizedFeatures) => {
    if (practiceMode !== 'webcam') return;
    if (!normalizedFeatures || isSuccess) {
      setMatchScore(0);
      successDuration.current = 0;
      return;
    }

    const targetKey = activeCard.id;
    const targetCoords = DEFAULT_TEMPLATES[targetKey];

    if (!targetCoords) {
      setMatchScore(0);
      return;
    }

    let sum = 0;
    for (let i = 0; i < 42; i++) {
      const diff = normalizedFeatures[i] - targetCoords[i];
      sum += diff * diff;
    }
    const dist = Math.sqrt(sum);
    const maxAllowedDist = 1.3;
    let score = Math.max(0, 1 - (dist / maxAllowedDist));
    let scorePercentage = Math.round(score * 100);
    if (scorePercentage > 60) {
      scorePercentage = Math.min(100, scorePercentage + 10);
    }
    
    setMatchScore(scorePercentage);

    if (scorePercentage >= 82) {
      successDuration.current += 1;
      if (successDuration.current >= 20) {
        handleSuccess();
      }
    } else {
      successDuration.current = 0;
    }
  };

  const handleSuccess = () => {
    setIsSuccess(true);
    if (practiceMode === 'webcam') {
      setCompletedWebcam((prev) => ({ ...prev, [activeCard.id]: true }));
    } else {
      setCompletedGlove((prev) => ({ ...prev, [activeCard.id]: true }));
    }
    const cardEl = document.getElementById("practice-stage-card");
    if (cardEl) cardEl.classList.add("matched");
  };

  const nextCard = () => {
    const cardEl = document.getElementById("practice-stage-card");
    if (cardEl) cardEl.classList.remove("matched");
    setIsSuccess(false);
    setMatchScore(0);
    successDuration.current = 0;
    setActiveCardIdx((prev) => (prev + 1) % currentCards.length);
  };

  const resetProgress = () => {
    if (practiceMode === 'webcam') setCompletedWebcam({});
    else setCompletedGlove({});
    setActiveCardIdx(0);
    setIsSuccess(false);
    setMatchScore(0);
    successDuration.current = 0;
  };

  const switchMode = (mode) => {
    setPracticeMode(mode);
    setActiveCardIdx(0);
    setIsSuccess(false);
    setMatchScore(0);
    successDuration.current = 0;
  };

  const getScoreColor = () => {
    if (matchScore >= 80) return 'var(--success)';
    if (matchScore >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="page-container">
      <h2 className="gradient-title">Interactive Sign Practice</h2>
      <p className="page-subtitle">
        Practice ISL signs with real-time feedback. Select a mode below to train with either the webcam or the sensor glove.
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '400px' }}>
        <button 
          className={`btn ${practiceMode === 'webcam' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchMode('webcam')}
          style={{ flex: 1 }}
        >
          <Camera size={18} />
          <span>Webcam Signs</span>
        </button>
        <button 
          className={`btn ${practiceMode === 'glove' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            if (!isGloveConnected() && practiceMode !== 'glove') {
              alert("Please connect the glove from the Home page first.");
              return;
            }
            switchMode('glove');
          }}
          style={{ flex: 1 }}
        >
          <Radio size={18} />
          <span>Glove Signs</span>
        </button>
      </div>

      <div className="practice-layout">
        {/* Left: Card Selection list */}
        <div className="card-deck">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="prediction-label">
                {practiceMode === 'webcam' ? 'Webcam Practice List' : 'Glove Practice List'}
              </span>
              <button 
                onClick={resetProgress}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem'
                }}
              >
                <RefreshCw size={12} />
                <span>Reset Levels</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentCards.map((card, idx) => {
                const isCompleted = completedList[card.id];
                const isActive = activeCardIdx === idx;
                
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setIsSuccess(false);
                      setMatchScore(0);
                      successDuration.current = 0;
                      setActiveCardIdx(idx);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.25rem',
                      borderRadius: '12px',
                      background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid var(--primary-glow)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}>
                        {idx + 1}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: isActive ? '#fff' : 'var(--text-secondary)', display: 'block' }}>
                          {card.name}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {card.category}
                        </span>
                      </div>
                    </div>

                    {isCompleted && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practice Instructions Card */}
          <div id="practice-stage-card" className="glass-card practice-card">
            {isSuccess ? (
              <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Award size={40} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Excellent! Level Passed</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    You matched the {activeCard.name} with high accuracy.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={nextCard}>
                  <span>Next Level</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                    {practiceMode === 'webcam' ? '📷 Webcam Mode' : '🧤 Glove Mode'}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeCard.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.5rem' }}>
                    {activeCard.description}
                  </p>
                </div>

                {/* Visual reference */}
                {practiceMode === 'webcam' ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <HandPositionSVG gestureId={activeCard.id} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                      <strong>Hand Position:</strong> {activeCard.handPosition}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <TargetSensorBars gesture={activeCard} liveData={gloveData} />
                  </div>
                )}

                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <span>Target Precision</span>
                    <span style={{ fontWeight: 700 }}>82% Required</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${matchScore}%`,
                      height: '100%',
                      background: getScoreColor(),
                      borderRadius: '10px',
                      transition: 'width 0.1s ease, background-color 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <div className={`match-score-badge ${matchScore >= 82 ? 'success' : ''}`}>
                      <span>Accuracy Match: {matchScore}%</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Feed */}
        <div className="camera-section">
          {practiceMode === 'webcam' ? (
            <WebcamStream onHandLandmarks={handleHandLandmarks} />
          ) : (
            <div style={{ height: '480px' }}>
              <GloveVisualizer flex={gloveData.flex} roll={gloveData.roll} pitch={gloveData.pitch} />
            </div>
          )}
          
          <div className="glass-card" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <HelpCircle size={24} className="text-glow" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Tip:</strong> {practiceMode === 'webcam' 
                ? 'Position your hand inside the camera frame. Match the hand wireframe shown in the practice card. Hold the pose until the accuracy bar fills up!'
                : 'Move your glove fingers to match the target sensor values shown in the practice card. The green bars show your live readings against the target zones.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
