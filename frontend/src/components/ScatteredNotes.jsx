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

    // Track mouse for the following effect
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Pre-render white music notes
    const offscreenCanvases = {};
    const musicNotes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];

    musicNotes.forEach(note => {
      const offCanvas = document.createElement('canvas');
      const size = 64; 
      offCanvas.width = size;
      offCanvas.height = size;
      const offCtx = offCanvas.getContext('2d');
      
      offCtx.font = 'bold 40px Arial';
      offCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // White
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(note, size / 2, size / 2);
      
      offscreenCanvases[note] = offCanvas;
    });

    const numParticles = 300; 
    const particles = [];

    // Distribute particles spherically then scatter them massively
    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      particles.push({
        baseX: Math.sin(phi) * Math.cos(theta),
        baseY: Math.sin(phi) * Math.sin(theta),
        baseZ: Math.cos(phi),
        size: Math.random() * 6 + 4, 
        noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
        scatterDirX: (Math.random() - 0.5) * 120, // Wide scatter spread
        scatterDirY: (Math.random() - 0.5) * 120,
        scatterDirZ: (Math.random() - 0.5) * 120,
      });
    }

    let time = 0;
    let rotation = 0;
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Smoothly follow mouse
      currentPos.x += (mouse.x - currentPos.x) * 0.05;
      currentPos.y += (mouse.y - currentPos.y) * 0.05;

      time += 0.015;
      rotation += 0.002; 

      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      const tilt = 0.4;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      const baseRadius = 150;

      particles.forEach((p) => {
        let rx = p.baseX * cosR - p.baseZ * sinR;
        let rz = p.baseX * sinR + p.baseZ * cosR;
        let ry = p.baseY;

        let ty = ry * cosT - rz * sinT;
        let tz = ry * sinT + rz * cosT;

        const nx = rx * 2;
        const ny = ty * 2;
        const nz = tz * 2;
        const fluidDisplacement = Math.sin(nx + time) * Math.cos(ny - time) * Math.sin(nz + time);
        
        const currentRadius = baseRadius + (fluidDisplacement * 40);

        let finalX = rx * currentRadius;
        let finalY = ty * currentRadius;
        let finalZ = tz * currentRadius;

        // Apply permanent massive scatter
        finalX += p.scatterDirX * 30;
        finalY += p.scatterDirY * 30;
        finalZ += p.scatterDirZ * 30;

        const focalLength = 500;
        const zDepth = focalLength + finalZ;
        
        if (zDepth < 10) return;

        const scale = focalLength / zDepth;
        
        // Offset relative to the mouse-tracking center
        const x2d = currentPos.x + finalX * scale;
        const y2d = currentPos.y + finalY * scale;

        let baseAlpha = Math.max(0.1, Math.min(0.8, scale - 0.1));
        
        if (baseAlpha > 0.01) {
          ctx.globalAlpha = baseAlpha;
          const drawSize = p.size * scale * 2.5; 
          ctx.drawImage(
            offscreenCanvases[p.noteChar], 
            x2d - drawSize / 2, 
            y2d - drawSize / 2, 
            drawSize, 
            drawSize
          );
        }
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
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
