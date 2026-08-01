import React, { useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider, SocketContext } from './context/SocketContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import LiveSession from './pages/LiveSession';
import Dashboard from './pages/Dashboard';
import GamePiano from './pages/GamePiano';
import GameViolin from './pages/GameViolin';
import GameDrum from './pages/GameDrum';
import Discover from './pages/Discover';
import SupportUs from './pages/SupportUs';
import Premium from './pages/Premium';
import VocalTuner from './pages/VocalTuner';
import TutorialSelect from './pages/TutorialSelect';
import TutorialDrum from './pages/TutorialDrum';
import TutorialPiano from './pages/TutorialPiano';
import TutorialViolin from './pages/TutorialViolin';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const { currentNote } = useContext(SocketContext);
  const [activeInstrument, setActiveInstrument] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (currentNote && currentNote.instrument) {
      setActiveInstrument(currentNote.instrument);
    }
  }, [currentNote]);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav className="nav-bar" style={{ 
      position: 'fixed', 
      top: 0, 
      width: '100%', 
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{fontWeight: '900', fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28" height="28" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="navBg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f0c29"/>
              <stop offset="50%" stopColor="#302b63"/>
              <stop offset="100%" stopColor="#24243e"/>
            </linearGradient>
            <linearGradient id="navWave" x1="0" y1="16" x2="48" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff00ff"/>
              <stop offset="50%" stopColor="#00e5ff"/>
              <stop offset="100%" stopColor="#7c4dff"/>
            </linearGradient>
            <linearGradient id="navSun" x1="14" y1="8" x2="34" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff6ec7"/>
              <stop offset="100%" stopColor="#ff9a00"/>
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="23" fill="url(#navBg)" stroke="url(#navWave)" strokeWidth="1.5"/>
          <circle cx="24" cy="18" r="8" fill="url(#navSun)" opacity="0.9"/>
          <line x1="16" y1="16" x2="32" y2="16" stroke="#0f0c29" strokeWidth="1.2" opacity="0.5"/>
          <line x1="16.5" y1="18.5" x2="31.5" y2="18.5" stroke="#0f0c29" strokeWidth="1" opacity="0.4"/>
          <line x1="17" y1="21" x2="31" y2="21" stroke="#0f0c29" strokeWidth="0.8" opacity="0.3"/>
          <path d="M4 28 Q10 22, 16 28 T28 28 T40 28 L44 28" fill="none" stroke="url(#navWave)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4 32 Q10 27, 16 32 T28 32 T40 32 L44 32" fill="none" stroke="url(#navWave)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
          <path d="M4 36 Q10 32, 16 36 T28 36 T40 36 L44 36" fill="none" stroke="url(#navWave)" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
        </svg>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>SynthWave</Link>
        {activeInstrument && (
          <span style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.3rem 0.8rem', background: 'rgba(14,165,233,0.1)', borderRadius: '20px', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.3)', verticalAlign: 'middle', letterSpacing: '0px' }}>
            🎵 Active: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{activeInstrument}</span>
          </span>
        )}
      </div>

      {/* Mobile Menu Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mobile-toggle"
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.8rem',
          cursor: 'pointer',
          color: 'var(--text-main)',
          padding: '4px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links ${isOpen ? 'mobile-open' : ''}`}>
        {user ? (
          <>
            <Link to="/live">Live Session</Link>
            <Link to="/tutorial">Tutorial</Link>
            <Link to="/dashboard">Dashboard</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
          </>
        ) : (
          <>
            <Link to="/discover">Discover</Link>
            <Link to="/support">Support Us</Link>
            <Link to="/premium">Premium</Link>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Navigation />
          <div style={{ paddingTop: '80px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/support" element={<SupportUs />} />
              <Route path="/premium" element={<Premium />} />
              {/* Protected Routes */}
              <Route path="/live" element={<PrivateRoute><LiveSession /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/game/piano" element={<PrivateRoute><GamePiano /></PrivateRoute>} />
              <Route path="/game/violin" element={<PrivateRoute><GameViolin /></PrivateRoute>} />
              <Route path="/game/drum" element={<PrivateRoute><GameDrum /></PrivateRoute>} />
              <Route path="/vocal-tuner" element={<PrivateRoute><VocalTuner /></PrivateRoute>} />
              
              {/* Tutorial Routes */}
              <Route path="/tutorial" element={<PrivateRoute><TutorialSelect /></PrivateRoute>} />
              <Route path="/tutorial/drum/:songId" element={<PrivateRoute><TutorialDrum /></PrivateRoute>} />
              <Route path="/tutorial/piano/:songId" element={<PrivateRoute><TutorialPiano /></PrivateRoute>} />
              <Route path="/tutorial/violin/:songId" element={<PrivateRoute><TutorialViolin /></PrivateRoute>} />
            </Routes>
          </div>
          <footer style={{ marginTop: 'auto', paddingTop: '4rem', paddingBottom: '1.5rem', width: '100%', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', position: 'relative', zIndex: 10 }}>
            <p>&copy; {new Date().getFullYear()} SynthWave. All rights reserved.</p>

          </footer>

        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
