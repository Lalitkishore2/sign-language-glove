import React from 'react';

export default function GloveVisualizer({ flex, roll, pitch }) {
  const flexLabels = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  
  return (
    <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', justifyContent: 'center' }}>
      <h3 className="text-glow" style={{ textAlign: 'center', marginBottom: '1rem' }}>Live Glove Data</h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '150px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
        {flex.map((val, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ 
              width: '40px', 
              height: '100px', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${val}%`,
                background: val > 80 ? 'var(--primary)' : 'var(--secondary)',
                transition: 'height 0.1s ease, background 0.2s ease'
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{flexLabels[idx]}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{val}%</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roll</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-glow)' }}>{roll.toFixed(1)}°</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pitch</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{pitch.toFixed(1)}°</div>
        </div>
      </div>
    </div>
  );
}
