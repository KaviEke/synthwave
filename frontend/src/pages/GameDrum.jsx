import React, { useContext, useState, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

function GameDrum() {
  const { currentNote } = useContext(SocketContext);
  const [score, setScore] = useState(0);
  const [beats, setBeats] = useState([]);
  const [message, setMessage] = useState('');

  // Spawn random beats
  useEffect(() => {
    const drums = ['SNARE', 'HAT', 'KICK'];
    const interval = setInterval(() => {
      const target = drums[Math.floor(Math.random() * drums.length)];
      setBeats(prev => [...prev, { id: Date.now(), target, y: 0 }]);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Move beats down
  useEffect(() => {
    const move = setInterval(() => {
      setBeats(prev => prev.map(b => ({ ...b, y: b.y + 5 })).filter(b => b.y < 100)); // Remove if missed
    }, 50);
    return () => clearInterval(move);
  }, []);

  // Check hardware hits
  useEffect(() => {
    if (currentNote && currentNote.instrument === 'drum') {
      const hit = currentNote.note.toUpperCase(); // SNARE, KICK, HAT
      let hitSuccess = false;

      setBeats(prev => {
        const remaining = [];
        for (let b of prev) {
          // If the beat is in the "hit zone" (y > 75) and matches the hardware pad
          if (b.y > 60 && b.y < 95 && b.target === hit && !hitSuccess) {
            hitSuccess = true;
            setScore(s => s + 50);
            setMessage('PERFECT HIT!');
          } else {
            remaining.push(b);
          }
        }
        return remaining;
      });

      if (!hitSuccess) {
        setMessage('MISS!');
      }

      setTimeout(() => setMessage(''), 1000);
    }
  }, [currentNote]);

  return (
    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>Drum Rhythm Master</h1>
      <h2 style={{ marginBottom: '2rem' }}>Score: {score}</h2>
      
      {message && <h3 style={{ color: message.includes('PERFECT') ? '#10b981' : '#ef4444', position: 'absolute', top: '150px' }}>{message}</h3>}

      <div style={{ width: '400px', height: '500px', background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', border: '2px solid #ef4444', borderRadius: '12px' }}>
        {/* Hit Zone Line */}
        <div style={{ position: 'absolute', top: '80%', width: '100%', height: '4px', background: '#ec4899', boxShadow: '0 0 10px #ec4899' }}></div>

        {/* Falling Beats */}
        <AnimatePresence>
          {beats.map(b => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                top: `${b.y}%`,
                left: b.target === 'SNARE' ? '15%' : b.target === 'KICK' ? '45%' : '75%',
                width: '60px',
                height: '20px',
                background: b.target === 'SNARE' ? '#3b82f6' : b.target === 'KICK' ? '#10b981' : '#f59e0b',
                borderRadius: '10px',
                textAlign: 'center',
                color: 'white',
                fontWeight: 'bold',
                lineHeight: '20px',
                boxShadow: '0 0 10px rgba(255,255,255,0.5)'
              }}
            >
              {b.target}
            </div>
          ))}
        </AnimatePresence>
      </div>
      <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>Hit the corresponding drum pad when the block crosses the glowing pink line!</p>
    </div>
  );
}

export default GameDrum;
