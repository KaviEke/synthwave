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

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
    let mouseTimeout;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
      
      // Stop dense spawning shortly after mouse stops moving
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.active = false;
      }, 150);
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
      offCtx.fillStyle = '#ffffff'; // White notes
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(note, size / 2, size / 2);
      
      offscreenCanvases[note] = offCanvas;
    });

    const numParticles = 1200; // Massively increased density
    const particles = [];
    const focalLength = 400;
    const maxDepth = 1500;
    const speed = 4.5;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 3500, 
        y: (Math.random() - 0.5) * 3500, 
        z: Math.random() * maxDepth,     
        size: Math.random() * 1.5 + 0.5,
        noteChar: musicNotes[Math.floor(Math.random() * musicNotes.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    let animationId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fixed center vanishing point (stops the whole site from moving with cursor)
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      particles.forEach((p) => {
        // Move particle towards camera (radiating outward effect)
        p.z -= speed;
        p.rot += p.rotSpeed;

        // Reset particle if it passes the camera
        if (p.z <= 10) {
          p.z = maxDepth;
          
          // Dense along cursor behavior
          // If mouse is moving, spawn a high percentage of new notes right where the mouse is pointing
          if (mouse.active && Math.random() > 0.25) {
            // Calculate where the mouse is in 3D space at maxDepth
            const worldMouseX = (mouse.x - centerX) * (maxDepth / focalLength);
            const worldMouseY = (mouse.y - centerY) * (maxDepth / focalLength);
            
            // Spawn tightly clustered around the mouse direction
            p.x = worldMouseX + (Math.random() - 0.5) * 500;
            p.y = worldMouseY + (Math.random() - 0.5) * 500;
          } else {
            // Normal wide uniform spawn
            p.x = (Math.random() - 0.5) * 3500;
            p.y = (Math.random() - 0.5) * 3500;
          }
        }

        // 3D to 2D projection
        const scale = focalLength / p.z;
        const x2d = centerX + (p.x * scale);
        const y2d = centerY + (p.y * scale);

        // Opacity fading
        let opacity = 1;
        if (p.z > maxDepth - 300) {
           opacity = (maxDepth - p.z) / 300; // Fade in from distance
        } else if (p.z < 150) {
           opacity = p.z / 150; // Fade out as it passes camera
        }
        
        // Base transparency for subtle background look
        opacity *= 0.7; 

        // Draw if on screen
        if (x2d > -150 && x2d < canvas.width + 150 && y2d > -150 && y2d < canvas.height + 150) {
          ctx.save();
          ctx.translate(x2d, y2d);
          ctx.rotate(p.rot);
          ctx.globalAlpha = Math.max(0, opacity);
          
          const drawSize = 40 * p.size * scale;
          ctx.drawImage(
            offscreenCanvases[p.noteChar],
            -drawSize / 2,
            -drawSize / 2,
            drawSize,
            drawSize
          );
          ctx.restore();
        }
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
