import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    if (currentNote && currentNote.instrument) {
      setActiveInstrument(currentNote.instrument);
    }
  }, [currentNote]);

  return (
    <nav className="nav-bar" style={{ 
      position: 'fixed', 
      top: 0, 
      width: '100%', 
      zIndex: 50
    }}>
      <div style={{fontWeight: '900', fontSize: '1.4rem', color: 'var(--text-main)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
        <span style={{ display: 'inline-block', width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '50%' }}></span>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>SYNTRONICS</Link>
        {activeInstrument && (
          <span style={{ marginLeft: '1rem', fontSize: '0.8rem', padding: '0.3rem 0.8rem', background: 'rgba(14,165,233,0.1)', borderRadius: '20px', color: 'var(--primary)', border: '1px solid rgba(14,165,233,0.3)', verticalAlign: 'middle', letterSpacing: '0px' }}>
            🎵 Active: <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{activeInstrument}</span>
          </span>
        )}
      </div>
      <div className="nav-links">
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
            <p>&copy; {new Date().getFullYear()} SYNTRONICS. All rights reserved.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>Developed by Kavindu Ekanayaka and Chamoth Liyanaarachchi</p>
          </footer>

        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
