import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../config';
import DiagnosticCard from '../components/DiagnosticCard';

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
        width: '100%',
        maxWidth: '400px',
        height: 'auto',
        aspectRatio: '1',
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
  const { hardwareState, currentNote, lastPerformanceEvent } = useContext(SocketContext);
  const { user, token } = useContext(AuthContext);

  const { deviceStatus, activeNotes } = hardwareState;
  
  // Local session state
  const [sessionActive, setSessionActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [notesPlayed, setNotesPlayed] = useState(0);
  const [instrumentsUsed, setInstrumentsUsed] = useState(new Set());
  
  // Independent visual states
  const [displayInstrument, setDisplayInstrument] = useState(null);
  const [displayNote, setDisplayNote] = useState(null);

  // Track note playing logic — ALWAYS update display, session only controls recording
  useEffect(() => {
    if (sessionActive && currentNote) {
      setNotesPlayed(prev => prev + 1);
      setInstrumentsUsed(prev => new Set(prev).add(currentNote.instrument));
    }

    // Always update visual display regardless of session state
    if (currentNote) {
      setDisplayInstrument(currentNote.instrument);
      setDisplayNote(currentNote);
      
      // Only timeout for drums since they don't have note_off
      if (currentNote.instrument === 'drum') {
        const timer = setTimeout(() => setDisplayNote(null), 1000);
        return () => clearTimeout(timer);
      }
    } else {
      // Check if we have a released event — keep showing for 1.5s (handled by SocketContext)
      if (!lastPerformanceEvent) {
        setDisplayNote(null);
      }
    }
  }, [currentNote, sessionActive, lastPerformanceEvent]);

  const toggleSession = async () => {
    if (sessionActive) {
      // End session
      setSessionActive(false);
      const endTime = new Date();
      const durationMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
      
      try {
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

  const piActive = deviceStatus['raspberry-pi-4b']?.active || deviceStatus['raspberry-pi-simulator']?.active || false;
  const c1Active = deviceStatus['controller-1']?.active;
  const c2Active = deviceStatus['controller-2']?.active;

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

      {/* DIAGNOSTIC CARD */}
      <DiagnosticCard />

      {/* Device Status Bar */}
      <motion.div 
        style={{ width: '100%', maxWidth: '800px', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', backdropFilter: 'blur(20px)', zIndex: 1, flexWrap: 'wrap', gap: '1rem' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
           {/* Pi Status */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: piActive ? '#10b981' : '#ef4444', boxShadow: `0 0 8px ${piActive ? '#10b981' : '#ef4444'}` }} />
              <span style={{ fontSize: '0.9rem', color: piActive ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>Pi Bridge</span>
           </div>
           {/* C1 Status */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c1Active ? '#0ea5e9' : '#475569', boxShadow: c1Active ? `0 0 8px #0ea5e9` : 'none' }} />
              <span style={{ fontSize: '0.9rem', color: c1Active ? '#0ea5e9' : '#94a3b8', fontWeight: 'bold' }}>Controller 1</span>
           </div>
           {/* C2 Status */}
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c2Active ? '#8b5cf6' : '#475569', boxShadow: c2Active ? `0 0 8px #8b5cf6` : 'none' }} />
              <span style={{ fontSize: '0.9rem', color: c2Active ? '#8b5cf6' : '#94a3b8', fontWeight: 'bold' }}>Controller 2</span>
           </div>
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
            {displayNote && (() => {
              const dn = displayNote;
              const noteKey = `${dn.midiNote || dn.drum || dn.note}-${dn.instrument}-${dn.type}`;
              const isReleased = dn._released;
              // Build display label
              let noteLabel;
              if (dn.instrument === 'drum') {
                noteLabel = dn.drum || dn.note || '?';
              } else {
                noteLabel = dn.swara || dn.noteName || dn.note || '?';
              }
              let detailLine;
              if (dn.instrument === 'drum') {
                detailLine = dn.controllerId ? `C${dn.controllerId} · GPIO ${dn.gpio ?? '?'}` : '';
              } else {
                const parts = [];
                if (dn.noteName) parts.push(dn.noteName);
                if (dn.controllerId) parts.push(`C${dn.controllerId}`);
                if (dn.gpio != null) parts.push(`GPIO ${dn.gpio}`);
                detailLine = parts.join(' · ');
              }
              return (
                <motion.div 
                  key={noteKey}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isReleased ? 0.5 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.75rem 2rem', borderRadius: '50px', border: `1px solid ${getInstrumentColor(dn.instrument)}`, boxShadow: `0 0 30px ${getInstrumentColor(dn.instrument)}30`, backdropFilter: 'blur(10px)' }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getInstrumentColor(dn.instrument), boxShadow: `0 0 15px ${getInstrumentColor(dn.instrument)}` }}></div>
                  <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '500' }}>
                    {dn.instrument}{isReleased ? ' ↓' : ''}
                  </div>
                  <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getInstrumentColor(dn.instrument), lineHeight: 1 }}>
                      {noteLabel}
                    </div>
                    {detailLine && (
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', marginTop: '2px' }}>
                        {detailLine}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
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
