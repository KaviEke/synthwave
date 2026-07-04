import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
const InteractiveInstrument = ({ instrument }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-200, 200], [20, -20]);
  const rotateY = useTransform(x, [-200, 200], [-20, 20]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  let imageSrc = null;
  if (instrument?.toLowerCase() === 'violin') imageSrc = '/images/neon_violin.png';
  if (instrument?.toLowerCase() === 'piano') imageSrc = '/images/neon_piano.png';
  if (instrument?.toLowerCase() === 'drum') imageSrc = '/images/neon_drum.png';
  if (instrument?.toLowerCase() === 'vocal') imageSrc = '/images/neon_vocal.png';

  if (!imageSrc) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', textAlign: 'center', marginTop: '2rem' }}>
      Waiting for instrument notes...
    </div>
  );

  return (
    <motion.div
      style={{
        width: '400px',
        height: '400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: '1200px',
        zIndex: 0
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.img
        src={imageSrc}
        alt={instrument}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.8)) mix-blend-mode-screen',
        }}
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
};

function LiveSession() {
  const { deviceStatus, currentNote } = useContext(SocketContext);
  const { user, token } = useContext(AuthContext);

  // Local session state
  const [sessionActive, setSessionActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [notesPlayed, setNotesPlayed] = useState(0);
  const [instrumentsUsed, setInstrumentsUsed] = useState(new Set());
  
  // Independent visual states
  const [displayInstrument, setDisplayInstrument] = useState(null);
  const [displayNote, setDisplayNote] = useState(null);

  // Track note playing logic
  useEffect(() => {
    if (sessionActive && currentNote) {
      setNotesPlayed(prev => prev + 1);
      setInstrumentsUsed(prev => new Set(prev).add(currentNote.instrument));
    }

    if (currentNote) {
      setDisplayInstrument(currentNote.instrument);
      setDisplayNote(currentNote);

      const timer = setTimeout(() => {
        setDisplayNote(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentNote, sessionActive]);

  const toggleSession = async () => {
    if (sessionActive) {
      // End session
      setSessionActive(false);
      const endTime = new Date();
      const durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
      
      try {
        const API_URL = 'http://localhost:5000/api';
        await axios.post(`${API_URL}/session`, {
          durationMinutes,
          notesPlayed,
          instrumentsUsed: Array.from(instrumentsUsed)
        }, {
          headers: { 'x-auth-token': token }
        });
        alert('Session saved successfully!');
      } catch (err) {
        console.error('Failed to save session');
      }
      
      // Reset
      setNotesPlayed(0);
      setInstrumentsUsed(new Set());
    } else {
      // Start session
      setSessionActive(true);
      setStartTime(new Date());
    }
  };
  
  // Get color based on instrument
  const getInstrumentColor = (instrument) => {
    switch(instrument?.toLowerCase()) {
      case 'violin': return '#f59e0b'; // Amber
      case 'drum': return '#ef4444';   // Red
      case 'piano': return '#3b82f6';  // Blue
      case 'vocal': return '#c026d3';  // Purple/Fuchsia
      default: return 'var(--primary-glow)';
    }
  };

  return (
    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      
      {/* Background Pulse */}
      {sessionActive && (
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: 'absolute', top: '30%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}
        />
      )}

      {/* Device Status Bar */}
      <motion.div 
        style={{ width: '100%', maxWidth: '800px', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(20px)', zIndex: 1 }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%', 
            background: deviceStatus?.active ? '#10b981' : '#ef4444',
            boxShadow: `0 0 10px ${deviceStatus?.active ? '#10b981' : '#ef4444'}`
          }} />
          <span style={{ fontWeight: 500 }}>
            Device: {deviceStatus?.active ? `Connected (${deviceStatus?.deviceId || 'Hardware'})` : 'Waiting for connection...'}
          </span>
        </div>

        <button 
          onClick={toggleSession} 
          className={sessionActive ? "btn-secondary" : "btn-primary"}
          style={sessionActive ? { borderColor: '#ef4444', color: '#ef4444' } : {}}
        >
          {sessionActive ? 'End Session' : 'Start Session'}
        </button>
      </motion.div>

      {/* Main visualization area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '400px', marginTop: '1rem' }}>
        
        <InteractiveInstrument instrument={displayInstrument} />

        <div style={{ height: '80px', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
          <AnimatePresence mode="popLayout">
            {displayNote && (
              <motion.div 
                key={displayNote.note + displayNote.instrument}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.75rem 2rem', borderRadius: '50px', border: `1px solid ${getInstrumentColor(displayNote.instrument)}`, boxShadow: `0 0 30px ${getInstrumentColor(displayNote.instrument)}30`, backdropFilter: 'blur(10px)' }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getInstrumentColor(displayNote.instrument), boxShadow: `0 0 15px ${getInstrumentColor(displayNote.instrument)}` }}></div>
                <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '500' }}>
                  {displayNote.instrument}
                </div>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getInstrumentColor(displayNote.instrument) }}>
                  {displayNote.note}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Session Live Stats */}
      {sessionActive && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: '2rem', marginTop: '4rem', zIndex: 1 }}
        >
          <div style={{ padding: '1.5rem 2.5rem', textAlign: 'center', background: 'linear-gradient(to top, rgba(236,72,153,0.1), transparent)', borderBottom: '2px solid #ec4899', borderRadius: '12px' }}>
            <div style={{ color: '#f472b6', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Notes Played</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{notesPlayed}</div>
          </div>
          <div style={{ padding: '1.5rem 2.5rem', textAlign: 'center', background: 'linear-gradient(to top, rgba(16,185,129,0.1), transparent)', borderBottom: '2px solid #10b981', borderRadius: '12px' }}>
            <div style={{ color: '#34d399', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Instruments</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{instrumentsUsed.size}</div>
          </div>
        </motion.div>
      )}

    </div>
  );
}

export default LiveSession;
