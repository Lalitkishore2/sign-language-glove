import React, { useState } from 'react';
import { BookOpen, HelpCircle, ArrowRight } from 'lucide-react';
import { DEFAULT_TEMPLATES } from '../utils/SignClassifier';

const GALLERY_ITEMS = [
  { id: 'A', label: 'Letter A', category: 'Alphabet', desc: 'Fist with thumb upright along the outer side of the index finger.' },
  { id: 'B', label: 'Letter B', category: 'Alphabet', desc: 'Flat open hand with fingers together, thumb crossed across the palm.' },
  { id: 'C', label: 'Letter C', category: 'Alphabet', desc: 'All fingers and thumb curved to form a cup or C shape.' },
  { id: 'Open Hand', label: 'Space Sign', category: 'Control Sign', desc: 'All fingers spread wide. Used in the translator to insert a space.' },
  { id: 'Closed Fist', label: 'Pause Sign', category: 'Control Sign', desc: 'A tight fist with all fingers bent. Used in the translator to pause appending.' },
  { id: 'Pointing', label: 'Number 1', category: 'Number', desc: 'Index finger pointing straight up, thumb resting on bent middle finger.' },
  { id: 'Victory (V)', label: 'Number 2 / V', category: 'Number', desc: 'Index and middle fingers extended in a V, thumb holding other fingers down.' },
  { id: 'Y', label: 'Letter Y', category: 'Alphabet', desc: 'Thumb and pinky extended wide, middle three fingers curled in.' }
];

export default function Gallery({ setCurrentPage }) {
  const [selectedItem, setSelectedItem] = useState(GALLERY_ITEMS[0]);

  return (
    <div className="page-container">
      <h2 className="gradient-title">ISL Gesture Library</h2>
      <p className="page-subtitle">
        Browse the dictionary of pre-trained signs. Select a card to view detailed outline diagrams and explanation steps.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Left: Gesture Cards Grid */}
        <div>
          <div className="gallery-grid">
            {GALLERY_ITEMS.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="glass-card gallery-card"
                  style={{
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-card)',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? '0 10px 20px rgba(139, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div className="gallery-card-letter text-glow" style={{ fontSize: item.id.length > 2 ? '1.5rem' : '2.5rem' }}>
                    {item.id.length > 2 ? item.id.split(' ')[0] : item.id}
                  </div>
                  <div className="gallery-card-label">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Outline Inspector */}
        <div>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--border-glass-focus)' }}>
            <div>
              <span className="prediction-label" style={{ color: 'var(--secondary)' }}>{selectedItem.category}</span>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedItem.label}</h3>
            </div>

            {/* Gesture Visual Blueprint Mockup */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid var(--border-glass)'
            }}>
              {/* Radial gradient background */}
              <div style={{
                position: 'absolute',
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                filter: 'blur(10px)'
              }} />

              {/* Glowing SVG vector illustration of selected hand blueprint */}
              <svg 
                width="140" 
                height="140" 
                viewBox="0 0 100 100" 
                fill="none" 
                stroke="var(--secondary)" 
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' }}
              >
                {selectedItem.id === 'A' && (
                  <>
                    <path d="M 50 90 Q 42 70 42 50 T 42 45" />
                    <path d="M 50 90 Q 50 70 50 50 T 50 45" />
                    <path d="M 50 90 Q 58 70 58 50 T 58 45" />
                    <path d="M 50 90 Q 66 75 66 55 T 66 50" />
                    {/* Thumb extended to side */}
                    <path d="M 50 90 Q 28 85 24 75 T 22 62" stroke="var(--primary)" />
                  </>
                )}

                {selectedItem.id === 'B' && (
                  <>
                    <path d="M 50 90 Q 42 60 42 40 T 42 20" />
                    <path d="M 50 90 Q 50 60 50 38 T 50 18" />
                    <path d="M 50 90 Q 58 60 58 40 T 58 20" />
                    <path d="M 50 90 Q 66 65 66 45 T 66 25" />
                    {/* Thumb crossed over palm */}
                    <path d="M 50 90 Q 38 85 45 75 T 48 65" stroke="var(--primary)" />
                  </>
                )}

                {selectedItem.id === 'C' && (
                  <>
                    {/* Curved fingers */}
                    <path d="M 68 85 C 38 85 30 70 30 50 C 30 30 38 15 68 15" />
                    {/* Thumb curved below */}
                    <path d="M 68 85 C 45 85 42 80 40 70" stroke="var(--primary)" />
                  </>
                )}

                {(selectedItem.id === 'Open Hand' || selectedItem.id === 'Closed Fist' || selectedItem.id === 'Pointing' || selectedItem.id === 'Victory (V)' || selectedItem.id === 'Y') && (
                  <>
                    {/* Generic Blueprint Circle */}
                    <circle cx="50" cy="50" r="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                    <path d="M 50 90 Q 30 65 30 45 T 30 20" stroke={selectedItem.id === 'Open Hand' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'} />
                    <path d="M 50 90 Q 43 60 43 40 T 43 15" stroke={['Open Hand', 'Pointing', 'Victory (V)'].includes(selectedItem.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)'} />
                    <path d="M 50 90 Q 50 58 50 38 T 50 13" stroke={['Open Hand', 'Victory (V)'].includes(selectedItem.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'} />
                    <path d="M 50 90 Q 58 60 58 40 T 58 18" stroke={selectedItem.id === 'Open Hand' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'} />
                    <path d="M 50 90 Q 70 70 72 52 T 74 30" stroke={['Open Hand', 'Y'].includes(selectedItem.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'} />
                    <path d="M 50 90 Q 25 80 20 70 T 15 58" stroke={['Open Hand', 'Y'].includes(selectedItem.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)'} />
                  </>
                )}
              </svg>
              <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Joint Angulation Blueprint
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Gesture Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selectedItem.desc}
              </p>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                // If it's a practice letter, redirect to Learn, else redirect to Translator
                if (['A', 'B', 'C', 'L', 'V', 'Y'].includes(selectedItem.id.charAt(0))) {
                  setCurrentPage('learn');
                } else {
                  setCurrentPage('translator');
                }
              }}
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
