import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Translator from './pages/Translator';
import Trainer from './pages/Trainer';
import Learn from './pages/Learn';
import Gallery from './pages/Gallery';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} />;
      case 'translator':
        return <Translator />;
      case 'trainer':
        return <Trainer />;
      case 'learn':
        return <Learn />;
      case 'gallery':
        return <Gallery setCurrentPage={setCurrentPage} />;
      default:
        return <Home setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <>
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderPage()}
      </main>

      <footer style={{
        padding: '2rem',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        background: 'rgba(9, 9, 14, 0.4)'
      }}>
        <div>&copy; {new Date().getFullYear()} Ishaara 3.0 Translator. All rights reserved.</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
          Built with React &middot; MediaPipe Hands &middot; TensorFlow.js
        </div>
      </footer>
    </>
  );
}

export default App;
