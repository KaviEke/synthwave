import React, { useContext, useState, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

function GamePiano() {
  const { currentNote } = useContext(SocketContext);
  const [score, setScore] = useState(0);
  const [notesList, setNotesList] = useState([]);
  const [message, setMessage] = useState('');

  // The 4 notes we will use for this simple game
  const keys = ['C4', 'E4', 'G4', 'B4'];

  // Spawn falling notes
  useEffect(() => {
    const interval = setInterval(() => {
      const target = keys[Math.floor(Math.random() * keys.length)];
      setNotesList(prev => [...prev, { id: Date.now(), target, y: 0 }]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Move notes down every 50ms
  useEffect(() => {
    const move = setInterval(() => {
      setNotesList(prev => prev.map(n => ({ ...n, y: n.y + 4 })).filter(n => n.y < 100)); // Missed if it goes past 100
    }, 50);
    return () => clearInterval(move);
  }, []);

  // Check hardware hits (when a real piano key is pressed)
  useEffect(() => {
    if (currentNote && currentNote.instrument === 'piano') {
      const playedNote = currentNote.note.toUpperCase();
      let hitSuccess = false;

      setNotesList(prev => {
        const remaining = [];
        for (let n of prev) {
          // If the falling note is in the target bar (y > 70) and matches the hardware piano key
          if (n.y > 70 && n.y < 95 && n.target === playedNote && !hitSuccess) {
            hitSuccess = true;
            setScore(s => s + 100);
            setMessage('PERFECT CHORD!');
          } else {
            remaining.push(n);
          }
        }
        return remaining;
      });

      if (!hitSuccess && keys.includes(playedNote)) {
        setMessage('MISS!');
      }

      setTimeout(() => setMessage(''), 1000);
    }
  }, [currentNote]);

  const getLeftPos = (note) => {
    if (note === 'C4') return '10%';
    if (note === 'E4') return '35%';
    if (note === 'G4') return '60%';
    if (note === 'B4') return '85%';
    return '10%';
  };

  return (
    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '1rem' }}>Piano Synthesia Drop</h1>
      <h2 style={{ marginBottom: '2rem' }}>Score: {score}</h2>
      
      {message && <h3 style={{ color: message.includes('PERFECT') ? '#10b981' : '#ef4444', position: 'absolute', top: '150px' }}>{message}</h3>}

      <div style={{ width: '500px', height: '500px', background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', border: '2px solid #3b82f6', borderRadius: '12px' }}>
        
        {/* The Hit Bar */}
        <div style={{ position: 'absolute', top: '80%', width: '100%', height: '60px', background: 'rgba(59, 130, 246, 0.2)', borderTop: '2px solid #3b82f6', borderBottom: '2px solid #3b82f6' }}></div>

        {/* The 4 Piano Key Labels at the bottom */}
        <div style={{ position: 'absolute', top: '85%', width: '100%', display: 'flex', justifyContent: 'space-around', color: 'var(--text-muted)' }}>
          <span>C4</span>
          <span>E4</span>
          <span>G4</span>
          <span>B4</span>
        </div>

        {/* Falling Notes */}
        <AnimatePresence>
          {notesList.map(n => (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                top: `${n.y}%`,
                left: getLeftPos(n.target),
                transform: 'translateX(-50%)',
                width: '60px',
                height: '30px',
                background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                borderRadius: '5px',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.8)'
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Play the physical keys (C4, E4, G4, B4) when the blue blocks enter the target zone!</p>
    </div>
  );
}

export default GamePiano;
