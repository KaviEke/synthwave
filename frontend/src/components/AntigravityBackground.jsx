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

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Render the musical note offscreen for better performance
    const offscreenCanvas = document.createElement('canvas');
    const size = 32; 
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    const offCtx = offscreenCanvas.getContext('2d');
    
    offCtx.font = 'bold 24px Arial';
    offCtx.fillStyle = '#ffffff'; 
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillText('♪', size / 2, size / 2);

    const numParticles = 3500;
    const particles = [];

    // Distribute particles across a very large 3D volume
    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(1 - 2 * Math.random());
      const theta = Math.PI * 2 * Math.random();
      const r = Math.random() * 2500 + 200; // Radius spread from 200 to 2700

      particles.push({
        baseX: r * Math.sin(phi) * Math.cos(theta),
        baseY: r * Math.sin(phi) * Math.sin(theta),
        baseZ: r * Math.cos(phi),
        // Size varies between 4 and 12 (scaled later based on depth)
        size: Math.random() * 8 + 4, 
        // Opacity varies between 15% and 85% for slight emphasis
        opacity: Math.random() * 0.70 + 0.15,
        rotSpeedX: (Math.random() - 0.5) * 0.002,
        rotSpeedY: (Math.random() - 0.5) * 0.002,
      });
    }

    let time = 0;
    let rotationX = 0;
    let rotationY = 0;
    let animationId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Subtle parallax effect reacting to mouse movement (reduced so it doesn't move the site heavily)
      currentPos.x += (mouse.x - currentPos.x) * 0.05;
      currentPos.y += (mouse.y - currentPos.y) * 0.05;
      
      const parallaxOffsetX = (currentPos.x - window.innerWidth / 2) * 0.03;
      const parallaxOffsetY = (currentPos.y - window.innerHeight / 2) * 0.03;

      time += 0.005;
      rotationX += 0.001;
      rotationY += 0.0015;

      const cosRX = Math.cos(rotationX);
      const sinRX = Math.sin(rotationX);
      const cosRY = Math.cos(rotationY);
      const sinRY = Math.sin(rotationY);

      const focalLength = 600;
      const centerX = window.innerWidth / 2 + parallaxOffsetX;
      const centerY = window.innerHeight / 2 + parallaxOffsetY;

      particles.forEach((p) => {
        // Rotate around Y-axis
        let rx = p.baseX * cosRY - p.baseZ * sinRY;
        let ry = p.baseY;
        let rz = p.baseX * sinRY + p.baseZ * cosRY;

        // Rotate around X-axis
        let ty = ry * cosRX - rz * sinRX;
        let tz = ry * sinRX + rz * cosRX;

        // Gentle fluid/pulse motion
        const fluidX = Math.sin(ty * 0.002 + time) * 80;
        const fluidY = Math.cos(rx * 0.002 + time) * 80;
        
        let finalX = rx + fluidX;
        let finalY = ty + fluidY;
        let finalZ = tz;

        const zDepth = focalLength + finalZ;
        
        // Only render if in front of camera
        if (zDepth > 10) {
          const scale = focalLength / zDepth;
          const x2d = centerX + finalX * scale;
          const y2d = centerY + finalY * scale;

          // Frustum culling (only render if visible on screen)
          if (x2d > -50 && x2d < canvas.width + 50 && y2d > -50 && y2d < canvas.height + 50) {
            // Apply depth-based fading for distant particles
            let depthOpacity = p.opacity;
            if (zDepth > 2000) {
                depthOpacity *= Math.max(0, (3000 - zDepth) / 1000);
            }
            
            ctx.globalAlpha = depthOpacity;
            const drawSize = p.size * scale;
            
            ctx.drawImage(
              offscreenCanvas,
              x2d - drawSize / 2,
              y2d - drawSize / 2,
              drawSize,
              drawSize
            );
          }
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
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
