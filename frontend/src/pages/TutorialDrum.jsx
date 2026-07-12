import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SocketContext } from '../context/SocketContext';
import { songs } from '../data/songs';

const ACCENT = '#ec4899';
const DRUM_PADS = [
  { name: 'KICK', label: 'Kick', color: '#ef4444', icon: '🦶' },
  { name: 'SNARE', label: 'Snare', color: '#eab308', icon: '🥁' },
  { name: 'HIHAT', label: 'Hi-Hat', color: '#22c55e', icon: '🔔' },
  { name: 'TOM1', label: 'Tom 1', color: '#3b82f6', icon: '🪘' },
  { name: 'TOM2', label: 'Tom 2', color: '#0ea5e9', icon: '🪘' },
  { name: 'CRASH', label: 'Crash', color: '#a855f7', icon: '💥' },
  { name: 'CYMBAL', label: 'Cymbal', color: '#f97316', icon: '✨' },
];

const TutorialDrum = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { lastPerformanceEvent, hardwareState } = useContext(SocketContext);

  const song = songs.find((s) => s.id === songId);
  const notes = song?.parts?.drum?.notes || [];
  const totalNotes = notes.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [demoMode, setDemoMode] = useState(false);

  const piOnline = hardwareState.deviceStatus['raspberry-pi-4b']?.active || hardwareState.deviceStatus['raspberry-pi-simulator']?.active || false;

  const processHit = useCallback((playedDrum) => {
    if (completed || !playedDrum) return;
    const expected = notes[currentIndex]?.toUpperCase();
    const played = playedDrum.toUpperCase();

    if (played === expected) {
      setFeedback('correct');
      setScore((s) => s + 1);
      setTimeout(() => {
        setFeedback(null);
        if (currentIndex + 1 >= totalNotes) {
          setCompleted(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
      }, 350 / speed);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 400 / speed);
    }
  }, [completed, currentIndex, totalNotes, notes, speed]);

  useEffect(() => {
    if (!lastPerformanceEvent || completed || demoMode) return;
    if (lastPerformanceEvent.type !== 'drum_hit') return;

    const drum = lastPerformanceEvent.drum;
    if (drum) processHit(drum);
  }, [lastPerformanceEvent, completed, demoMode, processHit]);

  const handleDemoClick = (drumName) => {
    if (!demoMode) return;
    processHit(drumName);
  };

  if (!song) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#f3f4f6', fontSize: '1.3rem' }}>Song not found</p>
          <button onClick={() => navigate('/tutorial')} style={btnStyle}>Back to Tutorials</button>
        </div>
      </div>
    );
  }

  if (completed) {
    const pct = Math.round((score / totalNotes) * 100);
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ ...panelStyle, textAlign: 'center', padding: '3rem 2.5rem', maxWidth: 480 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ color: '#f3f4f6', fontSize: '2rem', marginBottom: '0.5rem' }}>Tutorial Complete!</h1>
          <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '1.5rem' }}>{song.title}</p>
          <div style={{
            fontSize: '3.5rem', fontWeight: 800,
            color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444',
            marginBottom: '0.5rem',
          }}>{pct}%</div>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>{score} / {totalNotes} notes correct</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setCurrentIndex(0); setScore(0); setCompleted(false); setFeedback(null); }} style={btnStyle}>🔁 Retry</button>
            <button onClick={() => navigate('/tutorial')} style={{ ...btnStyle, background: 'rgba(255,255,255,0.07)' }}>← Back to Tutorials</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const expectedNote = notes[currentIndex];
  const activePad = DRUM_PADS.find((p) => p.name === expectedNote) || DRUM_PADS[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1c', padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={() => navigate('/tutorial')} style={{ ...btnStyle, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>← Back to Tutorials</button>
        <h1 style={{ color: '#f3f4f6', fontSize: '1.4rem', fontWeight: 700, margin: 0, textAlign: 'center', flex: 1 }}>
          🥁 {song.title}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: piOnline ? '#22c55e' : '#ef4444' }} />
            <span style={{ fontSize: '0.7rem', color: piOnline ? '#22c55e' : '#9ca3af' }}>{piOnline ? 'HW' : 'No HW'}</span>
          </div>
          <button
            onClick={() => setDemoMode(d => !d)}
            style={{
              ...btnStyle, padding: '0.3rem 0.8rem', fontSize: '0.8rem',
              background: demoMode ? `${ACCENT}33` : 'transparent',
              borderColor: demoMode ? ACCENT : 'rgba(255,255,255,0.2)',
              color: demoMode ? ACCENT : '#9ca3af',
            }}
          >
            {demoMode ? '🖱 Demo ON' : '🖱 Demo'}
          </button>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Speed:</span>
          {[1, 1.5, 2].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: '0.3rem 0.6rem', borderRadius: 6,
              border: speed === s ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.1)',
              background: speed === s ? `${ACCENT}22` : 'transparent',
              color: speed === s ? ACCENT : '#9ca3af',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            }}>{s}x</button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Hit {currentIndex + 1} of {totalNotes}</span>
          <span style={{ color: ACCENT, fontSize: '0.82rem', fontWeight: 600 }}>Score: {score}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <motion.div
            animate={{ width: `${((currentIndex) / totalNotes) * 100}%` }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #f472b6)`, borderRadius: 3 }}
          />
        </div>
      </div>

      {/* Upcoming Pattern */}
      <div style={{ ...panelStyle, maxWidth: 900, margin: '0 auto 1.5rem', padding: '1rem 1.5rem' }}>
        <h3 style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.8rem', marginTop: 0 }}>Pattern</h3>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {notes.map((n, i) => {
            const pad = DRUM_PADS.find((p) => p.name === n) || DRUM_PADS[0];
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            return (
              <div key={i} style={{
                padding: '0.3rem 0.5rem',
                borderRadius: 6,
                fontSize: '0.65rem',
                fontWeight: 700,
                background: isCurrent ? `${pad.color}33` : isPast ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                color: isCurrent ? pad.color : isPast ? '#22c55e' : '#4b5563',
                border: isCurrent ? `1px solid ${pad.color}66` : '1px solid transparent',
                transition: 'all 0.3s',
                minWidth: 40,
                textAlign: 'center',
              }}>
                {n}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Hit Display */}
      <div style={{ maxWidth: 900, margin: '0 auto 2rem', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Hit this drum:</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${feedback}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-block', fontSize: '3rem', fontWeight: 900,
              color: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : activePad.color,
              textShadow: feedback === 'correct' ? '0 0 30px rgba(34,197,94,0.6)' : feedback === 'wrong' ? '0 0 30px rgba(239,68,68,0.6)' : `0 0 30px ${activePad.color}88`,
            }}
          >
            {feedback === 'correct' ? '✓' : feedback === 'wrong' ? '✗' : `${activePad.icon} ${expectedNote}`}
          </motion.div>
        </AnimatePresence>
        {feedback === 'correct' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#22c55e', fontSize: '0.9rem' }}>Nice hit!</motion.p>}
        {feedback === 'wrong' && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.9rem' }}>Wrong pad — hit {expectedNote}</motion.p>}
      </div>

      {/* Drum Pads */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ ...panelStyle, padding: '2rem', display: 'flex', justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          {DRUM_PADS.map((pad) => {
            const isActive = pad.name === expectedNote;
            return (
              <motion.div
                key={pad.name}
                onClick={() => handleDemoClick(pad.name)}
                animate={isActive ? {
                  boxShadow: [`0 0 20px ${pad.color}44`, `0 0 40px ${pad.color}88`, `0 0 20px ${pad.color}44`],
                  scale: [1, 1.05, 1],
                } : {}}
                transition={isActive ? { duration: 0.8, repeat: Infinity } : {}}
                style={{
                  width: 'var(--drum-pad-size, 100px)',
                  height: 'var(--drum-pad-size, 100px)',
                  borderRadius: '50%',
                  background: isActive
                    ? `radial-gradient(circle, ${pad.color}44, ${pad.color}11)`
                    : 'radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  border: isActive ? `3px solid ${pad.color}` : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: demoMode ? 'pointer' : 'default',
                  transition: 'border-color 0.3s',
                }}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{pad.icon}</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: isActive ? pad.color : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>{pad.label}</span>
              </motion.div>
            );
          })}
        </div>
        {demoMode && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            🖱 Click a drum to play (Demo Mode)
          </p>
        )}
      </div>
    </div>
  );
};

const panelStyle = {
  background: 'rgba(17, 24, 39, 0.7)',
  border: '1px solid rgba(236, 72, 153, 0.3)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
};

const btnStyle = {
  padding: '0.65rem 1.3rem',
  borderRadius: 10,
  border: `1px solid ${ACCENT}`,
  background: 'rgba(236, 72, 153, 0.12)',
  color: ACCENT,
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
};

export default TutorialDrum;
