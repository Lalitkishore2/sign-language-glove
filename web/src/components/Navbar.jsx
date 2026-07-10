import React, { useState, useEffect } from 'react';
import { Home, Sparkles, BookOpen, Image, Activity, Wand2, Bluetooth } from 'lucide-react';
import { isGloveConnected, onConnectionChange } from '../utils/GloveConnection';

export default function Navbar({ currentPage, setCurrentPage }) {
  const [gloveConnected, setGloveConnected] = useState(isGloveConnected());

  useEffect(() => {
    onConnectionChange((status) => {
      setGloveConnected(status);
    });
  }, []);
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'translator', label: 'Translator', icon: Sparkles },
    { id: 'trainer', label: 'Model Trainer', icon: Wand2 },
    { id: 'learn', label: 'Practice & Learn', icon: BookOpen },
    { id: 'gallery', label: 'ISL Gallery', icon: Image },
  ];

  return (
    <nav className="glass-nav">
      <div className="nav-brand" onClick={() => setCurrentPage('home')}>
        <div className="brand-logo">
          <Activity size={24} className="glow-icon" />
        </div>
        <span className="brand-text">Ishaara <span className="text-glow">3.0</span></span>
      </div>
      <div className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
              {isActive && <span className="active-indicator" />}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
        <Bluetooth size={16} color={gloveConnected ? 'var(--success)' : 'var(--text-muted)'} />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: gloveConnected ? 'var(--success)' : 'var(--text-muted)' }}>
          {gloveConnected ? 'Glove Connected' : 'Glove Disconnected'}
        </span>
      </div>
    </nav>
  );
}
