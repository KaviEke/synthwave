import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SocketContext } from '../context/SocketContext';
import { songs } from '../data/songs';

const PIANO_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCENT = '#0ea5e9';

const TutorialPiano = () => {
  const { songId } = useParams();
  const navigate = useNavigate();
  const { currentNote } = useContext(SocketContext);

  const song = songs.find((s) => s.id === songId);
  const notes = song?.parts?.piano?.notes || [];
  const totalNotes = notes.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [completed, setCompleted] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Compute which lyric line the current note belongs to
  const getLyricContext = useCallback(() => {
    if (!song?.lyrics) return { lineIndex: -1, noteInLine: -1 };
    let count = 0;
    for (let i = 0; i < song.lyrics.length; i++) {
      const lineLen = song.lyrics[i].notes.length;
      if (currentIndex < count + lineLen) {
        return { lineIndex: i, noteInLine: currentIndex - count };
      }
      count += lineLen;
    }
    return { lineIndex: -1, noteInLine: -1 };
  }, [currentIndex, song]);

  const { lineIndex } = getLyricContext();

  // Listen for note input
  useEffect(() => {
    if (!currentNote || completed) return;
    if (currentNote.instrument !== 'piano') return;

    const played = currentNote.note?.toUpperCase();
    const expected = notes[currentIndex]?.toUpperCase();

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
  }, [currentNote]);

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

  // Completion screen
  if (completed) {
    const pct = Math.round((score / totalNotes) * 100);
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            ...panelStyle,
            textAlign: 'center',
            padding: '3rem 2.5rem',
            maxWidth: 480,
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ color: '#f3f4f6', fontSize: '2rem', marginBottom: '0.5rem' }}>Tutorial Complete!</h1>
          <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '1.5rem' }}>{song.title}</p>
          <div style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444',
            marginBottom: '0.5rem',
          }}>{pct}%</div>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>{score} / {totalNotes} notes correct</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { setCurrentIndex(0); setScore(0); setCompleted(false); setFeedback(null); }} style={btnStyle}>
              🔁 Retry
            </button>
            <button onClick={() => navigate('/tutorial')} style={{ ...btnStyle, background: 'rgba(255,255,255,0.07)' }}>
              ← Back to Tutorials
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const expectedNote = notes[currentIndex];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1c', padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={() => navigate('/tutorial')} style={{ ...btnStyle, padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          ← Back to Tutorials
        </button>
        <h1 style={{ color: '#f3f4f6', fontSize: '1.4rem', fontWeight: 700, margin: 0, textAlign: 'center', flex: 1 }}>
          🎹 {song.title}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Speed:</span>
          {[1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: 6,
                border: speed === s ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.1)',
                background: speed === s ? `${ACCENT}22` : 'transparent',
                color: speed === s ? ACCENT : '#9ca3af',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >{s}x</button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Note {currentIndex + 1} of {totalNotes}</span>
          <span style={{ color: ACCENT, fontSize: '0.82rem', fontWeight: 600 }}>Score: {score}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
          <motion.div
            animate={{ width: `${((currentIndex) / totalNotes) * 100}%` }}
            style={{ height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #06b6d4)`, borderRadius: 3 }}
          />
        </div>
      </div>

      {/* Lyrics Panel */}
      {song.lyrics && (
        <div style={{ ...panelStyle, maxWidth: 900, margin: '0 auto 1.5rem', padding: '1.2rem 1.5rem' }}>
          <h3 style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: '0.8rem', marginTop: 0 }}>Lyrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {song.lyrics.map((l, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                borderRadius: 8,
                background: i === lineIndex ? `${ACCENT}15` : 'transparent',
                border: i === lineIndex ? `1px solid ${ACCENT}33` : '1px solid transparent',
                transition: 'all 0.3s',
              }}>
                <span style={{
                  color: i === lineIndex ? ACCENT : '#6b7280',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  minWidth: 80,
                  letterSpacing: 1,
                }}>{l.notes}</span>
                <span style={{
                  color: i === lineIndex ? '#f3f4f6' : '#6b7280',
                  fontSize: '0.95rem',
                  fontWeight: i === lineIndex ? 600 : 400,
                  transition: 'color 0.3s',
                }}>{l.line}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Note Display */}
      <div style={{ maxWidth: 900, margin: '0 auto 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Play this note:</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${feedback}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'inline-block',
              fontSize: '4rem',
              fontWeight: 900,
              color: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : ACCENT,
              textShadow: feedback === 'correct'
                ? '0 0 30px rgba(34,197,94,0.6)'
                : feedback === 'wrong'
                  ? '0 0 30px rgba(239,68,68,0.6)'
                  : `0 0 30px ${ACCENT}88`,
              minWidth: 80,
            }}
          >
            {feedback === 'correct' ? '✓' : feedback === 'wrong' ? '✗' : expectedNote}
          </motion.div>
        </AnimatePresence>
        {feedback === 'correct' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#22c55e', fontSize: '0.9rem' }}>
            Correct!
          </motion.p>
        )}
        {feedback === 'wrong' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '0.9rem' }}>
            Try again — play {expectedNote}
          </motion.p>
        )}
      </div>

      {/* Piano Keyboard */}
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ ...panelStyle, padding: 'var(--panel-padding-medium)', display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'nowrap' }}>
          {PIANO_KEYS.map((key) => {
            const isActive = key === expectedNote;
            return (
              <motion.div
                key={key}
                animate={isActive ? {
                  boxShadow: [`0 0 15px ${ACCENT}66`, `0 0 30px ${ACCENT}aa`, `0 0 15px ${ACCENT}66`],
                } : {}}
                transition={isActive ? { duration: 1, repeat: Infinity } : {}}
                style={{
                  flex: '1 1 0',
                  minWidth: '32px',
                  maxWidth: '72px',
                  height: 'var(--piano-key-height, 140px)',
                  background: isActive
                    ? `linear-gradient(180deg, ${ACCENT}33, ${ACCENT}11)`
                    : 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  border: isActive ? `2px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0 0 10px 10px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: '1rem',
                  cursor: 'default',
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: isActive ? ACCENT : '#6b7280',
                }}>{key}</span>
                {isActive && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      top: 12,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: ACCENT,
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const panelStyle = {
  background: 'rgba(17, 24, 39, 0.7)',
  border: '1px solid rgba(14, 165, 233, 0.3)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
};

const btnStyle = {
  padding: '0.65rem 1.3rem',
  borderRadius: 10,
  border: `1px solid #0ea5e9`,
  background: 'rgba(14, 165, 233, 0.12)',
  color: '#0ea5e9',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
};

export default TutorialPiano;
