import React, { useState } from 'react';
import { BookOpen, HelpCircle, ArrowRight, Camera, Radio } from 'lucide-react';
import { WEBCAM_ISL_GESTURES, GLOVE_ISL_GESTURES } from '../utils/ISLGestureLibrary';

export default function Gallery({ setCurrentPage }) {
  const [galleryMode, setGalleryMode] = useState('webcam'); // 'webcam' or 'glove'
  const currentItems = galleryMode === 'webcam' ? WEBCAM_ISL_GESTURES : GLOVE_ISL_GESTURES;
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedItem = currentItems[selectedIdx] || currentItems[0];

  const switchMode = (mode) => {
    setGalleryMode(mode);
    setSelectedIdx(0);
  };

  const fingers = ['thumb', 'index', 'middle', 'ring', 'little'];
  const fingerLabels = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];

  return (
    <div className="page-container">
      <h2 className="gradient-title">ISL Gesture Library</h2>
      <p className="page-subtitle">
        Browse the dictionary of ISL signs. Switch between Webcam and Glove modes to see gesture details for each input method.
      </p>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '400px' }}>
        <button 
          className={`btn ${galleryMode === 'webcam' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchMode('webcam')}
          style={{ flex: 1 }}
        >
          <Camera size={18} />
          <span>Webcam Signs</span>
        </button>
        <button 
          className={`btn ${galleryMode === 'glove' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => switchMode('glove')}
          style={{ flex: 1 }}
        >
          <Radio size={18} />
          <span>Glove Signs</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left: Gesture Cards Grid */}
        <div>
          <div className="gallery-grid">
            {currentItems.map((item, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIdx(idx)}
                  className="glass-card gallery-card"
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-card)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? '0 10px 20px rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div className="gallery-card-letter text-glow" style={{ fontSize: item.id.length > 3 ? '1.2rem' : '1.8rem' }}>
                    {item.id}
                  </div>
                  <div className="gallery-card-label">{item.name}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.category}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Inspector */}
        <div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border-glass-focus)' }}>
            <div>
              <span className="prediction-label" style={{ color: 'var(--secondary)' }}>{selectedItem.category}</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedItem.name}</h3>
            </div>

            {/* Visual Reference */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid var(--border-glass)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                width: '150px', height: '150px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                filter: 'blur(10px)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)'
              }} />

              {galleryMode === 'webcam' ? (
                /* SVG Hand wireframe for webcam */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100" fill="none" strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }}
                  >
                    <circle cx="50" cy="90" r="2" fill="var(--secondary)" />
                    <path d="M 50 90 Q 25 80 20 70 T 15 55" stroke="var(--primary)" />
                    <path d="M 50 90 Q 38 60 38 45 T 38 20" stroke="var(--secondary)" />
                    <path d="M 50 90 Q 50 55 50 40 T 50 15" stroke="var(--primary)" />
                    <path d="M 50 90 Q 62 60 62 45 T 62 20" stroke="var(--secondary)" />
                    <path d="M 50 90 Q 75 80 78 70 T 82 55" stroke="var(--primary)" />
                  </svg>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <strong>Hand Position:</strong> {selectedItem.handPosition}
                  </div>
                </div>
              ) : (
                /* Sensor target bars for glove */
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', textAlign: 'center' }}>
                    Target Flex Sensor Values
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', gap: '0.75rem' }}>
                    {fingers.map((finger, idx) => {
                      const target = selectedItem.flex[finger];
                      return (
                        <div key={finger} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                          <div style={{ 
                            width: '100%', height: '80px', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: '8px',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid var(--border-glass)'
                          }}>
                            <div style={{
                              position: 'absolute',
                              bottom: 0, left: 0, right: 0,
                              height: `${target}%`,
                              background: target > 50 ? 'var(--primary)' : 'var(--secondary)',
                              transition: 'height 0.3s ease',
                              opacity: 0.7
                            }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{fingerLabels[idx]}</span>
                          <span style={{ fontSize: '0.65rem', color: target === 0 ? 'var(--success)' : 'var(--primary)' }}>
                            {target === 0 ? 'Open' : target === 100 ? 'Bent' : `${target}%`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Roll / Pitch */}
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Roll Range</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                        {selectedItem.roll.min}° — {selectedItem.roll.max}°
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pitch Range</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>
                        {selectedItem.pitch.min}° — {selectedItem.pitch.max}°
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {galleryMode === 'webcam' ? 'Hand Landmark Reference' : 'Sensor Target Reference'}
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Gesture Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedItem.description}
              </p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => setCurrentPage('learn')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>Practice this Gesture</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
