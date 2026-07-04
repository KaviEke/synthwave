import React, { useContext, useState, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { motion } from 'framer-motion';

function GameViolin() {
  const { currentNote } = useContext(SocketContext);
  const [energy, setEnergy] = useState(100);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // The Violin mechanics: Continuous playing keeps the energy alive.
  // Stopping causes the energy to rapidly decay.

  useEffect(() => {
    const gameLoop = setInterval(() => {
      if (gameOver) return;

      setEnergy(prev => {
        const newEnergy = prev - 1.5; // Constantly draining
        if (newEnergy <= 0) {
          setGameOver(true);
          return 0;
        }
        return newEnergy;
      });

      // Increase score slightly just for surviving
      setScore(s => s + 1);
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameOver]);

  // When the Violin is played, replenish energy!
  useEffect(() => {
    if (gameOver) return;
    if (currentNote && currentNote.instrument === 'violin') {
      setEnergy(prev => Math.min(100, prev + 15)); // Big boost of energy per bow strike
      setScore(s => s + 15); // Bonus score for playing
    }
  }, [currentNote, gameOver]);

  return (
    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#8b5cf6', marginBottom: '1rem' }}>Violin Bow Survival</h1>
      
      {!gameOver ? (
        <h2 style={{ marginBottom: '2rem' }}>Score: {score}</h2>
      ) : (
        <h2 style={{ marginBottom: '2rem', color: '#ef4444' }}>GAME OVER! Final Score: {score}</h2>
      )}

      <div style={{ position: 'relative', width: '300px', height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '3rem' }}>
        
        {/* Glowing Energy Orb */}
        <motion.div 
          animate={{ 
            scale: energy / 100,
            opacity: energy / 100 
          }}
          transition={{ type: 'spring', bounce: 0.5 }}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, #c084fc 0%, #8b5cf6 50%, transparent 100%)`,
            boxShadow: `0 0 ${energy}px #8b5cf6`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10
          }}
        >
          {energy > 0 && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '2rem' }}>{Math.round(energy)}%</span>}
        </motion.div>

        {/* Pulse rings in the background */}
        {!gameOver && (
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '2px solid #8b5cf6',
              zIndex: 1
            }}
          />
        )}
      </div>

      <p style={{ marginTop: '5rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '500px' }}>
        The orb is dying in the vacuum of space! You must continuously play the Violin to generate sonic energy and keep the orb alive! If you stop playing, it will fade to zero.
      </p>

      {gameOver && (
        <button 
          className="btn-primary" 
          style={{ marginTop: '2rem' }}
          onClick={() => { setEnergy(100); setScore(0); setGameOver(false); }}
        >
          Restart Survival
        </button>
      )}
    </div>
  );
}

export default GameViolin;
