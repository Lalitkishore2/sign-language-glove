import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Activity, Cpu, Mic, Shield, Wifi } from 'lucide-react';
import { connectGlove, disconnectGlove, isGloveConnected, onConnectionChange } from '../utils/GloveConnection';

export default function Home({ setCurrentPage }) {
  const [gloveConnected, setGloveConnected] = useState(isGloveConnected());

  useEffect(() => {
    onConnectionChange((status) => {
      setGloveConnected(status);
    });
  }, []);

  const handleWifiToggle = async () => {
    if (gloveConnected) {
      await disconnectGlove();
    } else {
      const ip = prompt("Enter the IP address shown on the Glove's display (e.g. 192.168.1.50):");
      if (ip) {
        const success = await connectGlove(ip);
        if (!success) {
          alert(`Failed to connect to ${ip}. Make sure the glove is on the same network.`);
        }
      }
    }
  };
  return (
    <div className="page-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>
            Bridging Gaps with <br />
            <span className="text-glow">Real-Time ISL</span>
          </h1>
          <p className="hero-description">
            Experience the next generation of sign language translation. Built with high-precision client-side hand landmarker tracking and lightning-fast AI classification.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setCurrentPage('translator')}
            >
              <Sparkles size={20} />
              <span>Start Translating</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentPage('learn')}
            >
              <BookOpen size={20} />
              <span>Practice & Learn</span>
            </button>
            <button 
              className={`btn ${gloveConnected ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleWifiToggle}
              style={{
                background: gloveConnected ? 'rgba(16, 185, 129, 0.1)' : undefined,
                borderColor: gloveConnected ? 'var(--success)' : undefined
              }}
            >
              <Wifi size={20} color={gloveConnected ? "var(--success)" : "currentColor"} />
              <span style={{ color: gloveConnected ? 'var(--success)' : undefined }}>
                {gloveConnected ? 'Glove Connected (WiFi)' : 'Connect Glove (WiFi)'}
              </span>
            </button>
          </div>
        </div>

        <div className="hero-graphic">
          <div className="glow-circle"></div>
          <div className="interactive-mockup glass-card">
            <div className="mockup-header">
              <span className="prediction-label">AI Status</span>
              <div className="status-indicator">
                <div className="status-dot"></div>
                <span>Live Feed</span>
              </div>
            </div>
            
            <div className="mockup-body">
              {/* High-tech SVG hand wireframe representing landmark tracking */}
              <svg className="hand-wireframe" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Wrist */}
                <circle cx="50" cy="90" r="2" fill="var(--secondary)" />
                {/* Thumb */}
                <path d="M 50 90 Q 25 80 20 70 T 15 55" stroke="var(--primary)" />
                <circle cx="20" cy="70" r="1.5" fill="var(--primary)" />
                <circle cx="15" cy="55" r="1.5" fill="var(--primary)" />
                {/* Index */}
                <path d="M 50 90 Q 38 60 38 45 T 38 25" stroke="var(--secondary)" />
                <circle cx="38" cy="60" r="1.5" fill="var(--secondary)" />
                <circle cx="38" cy="45" r="1.5" fill="var(--secondary)" />
                <circle cx="38" cy="25" r="1.5" fill="var(--secondary)" />
                {/* Middle */}
                <path d="M 50 90 Q 50 55 50 40 T 50 20" stroke="var(--primary)" />
                <circle cx="50" cy="55" r="1.5" fill="var(--primary)" />
                <circle cx="50" cy="40" r="1.5" fill="var(--primary)" />
                <circle cx="50" cy="20" r="1.5" fill="var(--primary)" />
                {/* Ring */}
                <path d="M 50 90 Q 62 60 62 45 T 62 25" stroke="var(--secondary)" />
                <circle cx="62" cy="60" r="1.5" fill="var(--secondary)" />
                <circle cx="62" cy="45" r="1.5" fill="var(--secondary)" />
                <circle cx="62" cy="25" r="1.5" fill="var(--secondary)" />
                {/* Pinky */}
                <path d="M 50 90 Q 75 80 78 70 T 82 58" stroke="var(--primary)" />
                <circle cx="78" cy="70" r="1.5" fill="var(--primary)" />
                <circle cx="82" cy="58" r="1.5" fill="var(--primary)" />
                
                {/* Connecting bones */}
                <line x1="20" y1="70" x2="38" y2="60" stroke="rgba(255,255,255,0.1)" strokeDasharray="2" />
                <line x1="38" y1="60" x2="50" y2="55" stroke="rgba(255,255,255,0.1)" strokeDasharray="2" />
                <line x1="50" y1="55" x2="62" y2="60" stroke="rgba(255,255,255,0.1)" strokeDasharray="2" />
                <line x1="62" y1="60" x2="78" y2="70" stroke="rgba(255,255,255,0.1)" strokeDasharray="2" />
              </svg>
            </div>

            <div className="mockup-footer">
              <div className="prediction-label">Prediction</div>
              <div className="prediction-val">VICTORY (V)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card glass-card">
          <div className="feature-icon-wrapper">
            <Cpu size={24} />
          </div>
          <h3>Client-Side Inference</h3>
          <p>
            Powered by MediaPipe WebAssembly and TensorFlow.js, execution happens entirely on your device. Enjoy absolute privacy and lag-free tracking.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon-wrapper">
            <Mic size={24} />
          </div>
          <h3>Text-To-Speech</h3>
          <p>
            Instantly speak your translated gestures out loud using the browser speech engine. Communicate fluidly with others.
          </p>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon-wrapper">
            <Shield size={24} />
          </div>
          <h3>Custom Calibration</h3>
          <p>
            Calibrate the system with your unique hand dimensions. Record and train custom gestures instantly using on-device templates.
          </p>
        </div>
      </div>
    </div>
  );
}
