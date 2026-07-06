import React, { useEffect, useRef } from 'react';

const AntigravityBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const musicNotes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];
    const numParticles = 150; // Enough to scatter widely across the screen
    let particles = [];

    const generateParticles = (width, height) => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width, 
          y: Math.random() * height, 
          size: Math.random() * 1.5 + 0.5,
          noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
          rot: Math.random() * Math.PI * 2,
        });
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.12; // Lowered opacity to 12% for a subtle watermark effect
        
        ctx.font = `bold ${40 * p.size}px Arial`;
        ctx.fillStyle = '#ffffff'; // White notes
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.noteChar, 0, 0);
        
        ctx.restore();
      });
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate layout to cover the new screen size perfectly
      generateParticles(canvas.width, canvas.height);
      render();
    };

    // Initial setup and draw
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Sits cleanly behind interactive elements
        zIndex: 0,             // Low z-index background layer
      }}
    />
  );
};

export default AntigravityBackground;
