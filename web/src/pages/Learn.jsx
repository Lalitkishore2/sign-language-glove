import React, { useState, useEffect, useRef } from 'react';
import { Award, ArrowRight, CheckCircle2, RefreshCw, HelpCircle } from 'lucide-react';
import WebcamStream from '../components/WebcamStream';
import GloveVisualizer from '../components/GloveVisualizer';
import { isGloveConnected, onGloveData } from '../utils/GloveConnection';
import { DEFAULT_TEMPLATES, classifyGesture } from '../utils/SignClassifier';

const PRACTICE_CARDS = [
  { id: 'HEARING', name: 'Hearing', templateKey: 'HEARING', desc: 'Point index finger toward ear. Index+Middle bent, others open.' },
  { id: 'THANK YOU', name: 'Thank You', templateKey: 'THANK YOU', desc: 'Flat hand, all fingers open, palm out from chin.' },
  { id: 'MORNING', name: 'Morning', templateKey: 'MORNING', desc: 'All fingers extended upward (hand raised).' },
  { id: 'I', name: 'I', templateKey: 'I', desc: 'Point to self (index pointing up, others bent, palm facing in).' },
  { id: 'BYE', name: 'Bye', templateKey: 'BYE', desc: 'Open flat hand waving (all straight, tilted/rolled sideways).' },
  { id: 'NAME', name: 'Name', templateKey: 'NAME', desc: 'Two fingers (index+middle) tapping — both bent moderately.' },
  { id: 'INDIAN', name: 'Indian', templateKey: 'INDIAN', desc: 'Pinch near forehead (thumb+index pinch, others closed).' },
];

export default function Learn() {
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [matchScore, setMatchScore] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedList, setCompletedList] = useState({});

  const [inputSource, setInputSource] = useState(isGloveConnected() ? "glove" : "webcam");
  const [gloveData, setGloveData] = useState({ flex: [0,0,0,0,0], roll: 0, pitch: 0 });

  const activeCard = PRACTICE_CARDS[activeCardIdx];
  const successDuration = useRef(0);
  
  const inputSourceRef = useRef(inputSource);
  const activeCardRef = useRef(activeCard);
  const isSuccessRef = useRef(isSuccess);

  useEffect(() => {
    inputSourceRef.current = inputSource;
  }, [inputSource]);

  useEffect(() => {
    activeCardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    isSuccessRef.current = isSuccess;
  }, [isSuccess]);

  useEffect(() => {
    onGloveData((data) => {
      if (inputSourceRef.current === 'glove') {
        setGloveData(data);
        if (isSuccessRef.current) return;
        
        let scorePercentage = 0;
        if (data.gesture === activeCardRef.current.templateKey && data.confidence > 0) {
          scorePercentage = data.confidence;
        }

        setMatchScore(scorePercentage);
        if (scorePercentage >= 82) {
          successDuration.current += 1;
          if (successDuration.current >= 10) { // 10 packets = 1s
            handleSuccess();
          }
        } else {
          successDuration.current = 0;
        }
      }
    });
  }, []);

  const handleHandLandmarks = (rawLandmarks, normalizedFeatures) => {
    if (inputSource !== 'webcam') return;
    if (!normalizedFeatures || isSuccess) {
      setMatchScore(0);
      successDuration.current = 0;
      return;
    }

    // 1. Get Target Template coordinates
    const targetKey = activeCard.templateKey;
    const targetCoords = DEFAULT_TEMPLATES[targetKey];

    if (!targetCoords) {
      setMatchScore(0);
      return;
    }

    // 2. Calculate Euclidean Distance to target template
    let sum = 0;
    for (let i = 0; i < 42; i++) {
      const diff = normalizedFeatures[i] - targetCoords[i];
      sum += diff * diff;
    }
    const dist = Math.sqrt(sum);

    // 3. Convert distance to matching score percentage
    const maxAllowedDist = 1.3;
    let score = Math.max(0, 1 - (dist / maxAllowedDist));
    
    // Scale to percentage
    let scorePercentage = Math.round(score * 100);
    
    // Boost matching slightly for better game feel
    if (scorePercentage > 60) {
      scorePercentage = Math.min(100, scorePercentage + 10);
    }
    
    setMatchScore(scorePercentage);

    // 4. Require the user to hold the correct sign (> 82% match) for 20 frames (approx 1 sec)
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
    setCompletedList((prev) => ({ ...prev, [activeCard.id]: true }));
    
    // Play a glowing success trigger
    const cardEl = document.getElementById("practice-stage-card");
    if (cardEl) {
      cardEl.classList.add("matched");
    }
  };

  const nextCard = () => {
    const cardEl = document.getElementById("practice-stage-card");
    if (cardEl) {
      cardEl.classList.remove("matched");
    }
    setIsSuccess(false);
    setMatchScore(0);
    successDuration.current = 0;
    
    setActiveCardIdx((prev) => (prev + 1) % PRACTICE_CARDS.length);
  };

  const resetProgress = () => {
    setCompletedList({});
    setActiveCardIdx(0);
    setIsSuccess(false);
    setMatchScore(0);
    successDuration.current = 0;
  };

  // Determine progress bar color based on score
  const getScoreColor = () => {
    if (matchScore >= 80) return 'var(--success)';
    if (matchScore >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  return (
    <div className="page-container">
      <h2 className="gradient-title">Interactive Sign Practice</h2>
      <p className="page-subtitle">
        Gamify your learning. Select a letter below, match the gesture in front of the camera, and hold it to pass the level.
      </p>

      <div className="practice-layout">
        {/* Left: Card Selection list */}
        <div className="card-deck">
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="prediction-label">Practice List</span>
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
              {PRACTICE_CARDS.map((card, idx) => {
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
                        fontSize: '0.85rem'
                      }}>
                        {card.id.substring(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600, color: isActive ? '#fff' : 'var(--text-secondary)' }}>
                        {card.name}
                      </span>
                    </div>

                    {isCompleted && (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practice Instructions */}
          <div id="practice-stage-card" className="glass-card practice-card">
            {isSuccess ? (
              <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
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
                <div className="practice-letter" style={{ fontSize: '3rem' }}>
                  {activeCard.id}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Match the sign above</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: '280px' }}>
                    {activeCard.desc}
                  </p>
                </div>

                <div style={{ width: '100%', marginTop: '1rem' }}>
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

        {/* Right: Live Camera Feed */}
        <div className="camera-section">
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
          
          <div className="glass-card" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <HelpCircle size={24} className="text-glow" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Tip:</strong> Position your hand inside the camera frame. Try adjusting the distance to the camera if the tracking has difficulty detecting joint rotations. Maintain the pose until the accuracy bar fills up!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
