import React, { useEffect, useRef } from 'react';

const AntigravityBackground = () => {
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

    const mouse = { x: -1000, y: -1000, active: false };
    let mouseTimeout;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.active = false;
        mouse.x = -1000;
        mouse.y = -1000;
      }, 1000); // Mouse remains active for 1 second after stopping
    };
    window.addEventListener('mousemove', handleMouseMove);

    const offscreenCanvases = {};
    const musicNotes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];

    musicNotes.forEach(note => {
      const offCanvas = document.createElement('canvas');
      const size = 64; 
      offCanvas.width = size;
      offCanvas.height = size;
      const offCtx = offCanvas.getContext('2d');
      
      offCtx.font = 'bold 40px Arial';
      offCtx.fillStyle = '#ffffff'; 
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(note, size / 2, size / 2);
      
      offscreenCanvases[note] = offCanvas;
    });

    const numParticles = 200; // Less dense
    const particles = [];

    // Initialize particles uniformly
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * window.innerWidth, 
        y: Math.random() * window.innerHeight, 
        vx: (Math.random() - 0.5) * 1.0, // Slow free drift
        vy: (Math.random() - 0.5) * 1.0,
        size: Math.random() * 0.8 + 0.4,
        noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    let animationId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        // Move freely in 2D space
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        // Wrap around edges continuously
        if (p.x < -100) p.x = canvas.width + 100;
        if (p.x > canvas.width + 100) p.x = -100;
        if (p.y < -100) p.y = canvas.height + 100;
        if (p.y > canvas.height + 100) p.y = -100;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.5; // Base transparency for subtle background
        
        const drawSize = 40 * p.size;
        ctx.drawImage(
          offscreenCanvases[p.noteChar],
          -drawSize / 2,
          -drawSize / 2,
          drawSize,
          drawSize
        );
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(mouseTimeout);
      cancelAnimationFrame(animationId);
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

export default AntigravityBackground;
