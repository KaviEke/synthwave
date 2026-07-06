import React, { useEffect, useRef } from 'react';

const ScatteredNotes = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const musicNotes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];
    const offscreenCanvases = {};

    musicNotes.forEach(note => {
      const offCanvas = document.createElement('canvas');
      const size = 64; 
      offCanvas.width = size;
      offCanvas.height = size;
      const offCtx = offCanvas.getContext('2d');
      
      offCtx.font = 'bold 36px Arial';
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.25)'; // White notes, subtle transparency
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(note, size / 2, size / 2);
      
      offscreenCanvases[note] = offCanvas;
    });

    const numParticles = 80; // Enough to scatter nicely without being overwhelming
    let particles = [];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.2, // slight upward drift
          size: Math.random() * 0.6 + 0.4, // varying sizes
          noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.01
        });
      }
    };
    initParticles();

    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        // Wrap around edges to create continuous flow
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        const drawSize = 64 * p.size;
        ctx.drawImage(
          offscreenCanvases[p.noteChar], 
          -drawSize / 2, 
          -drawSize / 2, 
          drawSize, 
          drawSize
        );
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
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
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default ScatteredNotes;
