import React, { useEffect, useRef } from 'react';

const ParticleCursor = () => {
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

    // Track mouse - align right on load
    let mouse = { x: window.innerWidth * 0.75, y: window.innerHeight / 2 };
    let currentPos = { x: window.innerWidth * 0.75, y: window.innerHeight / 2 };
    
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Track scroll
    let scrollY = window.scrollY;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    // -------------------------------------------------------------
    // OPTIMIZATION: Pre-render music notes to offscreen canvases
    // -------------------------------------------------------------
    const offscreenCanvases = {};
    const musicNotes = ['♪', '♫', '♬', '♩', '𝄞', '𝄢'];

    musicNotes.forEach(note => {
      const offCanvas = document.createElement('canvas');
      const size = 64; // Render large once for crisp downscaling
      offCanvas.width = size;
      offCanvas.height = size;
      const offCtx = offCanvas.getContext('2d');
      
      offCtx.font = 'bold 40px Arial';
      offCtx.fillStyle = '#0ea5e9'; // Theme light blue
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(note, size / 2, size / 2);
      
      offscreenCanvases[note] = offCanvas;
    });

    // Reduce particle count to 500 for massive performance boost 
    // while still keeping the sphere looking dense
    const numParticles = 500; 
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      particles.push({
        baseX: Math.sin(phi) * Math.cos(theta),
        baseY: Math.sin(phi) * Math.sin(theta),
        baseZ: Math.cos(phi),
        size: Math.random() * 6 + 4, 
        noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
        scatterDirX: (Math.random() - 0.5) * 50,
        scatterDirY: (Math.random() - 0.5) * 50,
        scatterDirZ: (Math.random() - 0.5) * 50,
        currentScatterProgress: 0 
      });
    }

    let time = 0;
    let rotation = 0;
    let animationFrameId;

    let lastMouse = { x: mouse.x, y: mouse.y };
    let targetState = 0; 
    let smoothedState = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const mouseDx = mouse.x - lastMouse.x;
      const mouseDy = mouse.y - lastMouse.y;
      const mouseSpeed = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

      if (mouseSpeed > 0.5) {
        targetState = Math.min(1.0, targetState + 0.15); 
      } else {
        targetState = Math.max(0.0, targetState - 0.05); 
      }

      smoothedState += (targetState - smoothedState) * 0.08;

      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      currentPos.x += (mouse.x - currentPos.x) * 0.08;
      currentPos.y += (mouse.y - currentPos.y) * 0.08;

      time += 0.04;
      rotation += 0.005; 

      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      const tilt = 0.4;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      const baseRadius = 180 + (smoothedState * 70);
      const fluidity = smoothedState; 

      const scrollThreshold = 150;
      const targetScatter = Math.min(1.0, Math.max(0, scrollY / scrollThreshold));

      particles.forEach((p) => {
        p.currentScatterProgress += (targetScatter - p.currentScatterProgress) * 0.05;

        let rx = p.baseX * cosR - p.baseZ * sinR;
        let rz = p.baseX * sinR + p.baseZ * cosR;
        let ry = p.baseY;

        let ty = ry * cosT - rz * sinT;
        let tz = ry * sinT + rz * cosT;

        const nx = rx * 2;
        const ny = ty * 2;
        const nz = tz * 2;
        const fluidDisplacement = Math.sin(nx + time) * Math.cos(ny - time) * Math.sin(nz + time);
        
        const currentRadius = baseRadius + (fluidDisplacement * 80 * fluidity);

        let finalX = rx * currentRadius;
        let finalY = ty * currentRadius;
        let finalZ = tz * currentRadius;

        finalX += p.scatterDirX * p.currentScatterProgress * 30;
        finalY += p.scatterDirY * p.currentScatterProgress * 30;
        finalZ += p.scatterDirZ * p.currentScatterProgress * 30;

        const focalLength = 500;
        const zDepth = focalLength + finalZ;
        
        if (zDepth < 10) return;

        const scale = focalLength / zDepth;
        
        const x2d = currentPos.x + finalX * scale;
        const y2d = currentPos.y + finalY * scale;

        let baseAlpha = Math.max(0.1, Math.min(0.8, scale - 0.2));
        baseAlpha *= (1.0 - p.currentScatterProgress); 

        // Draw pre-rendered images instead of recalculating fonts
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

      // Reset alpha
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
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

export default ParticleCursor;
