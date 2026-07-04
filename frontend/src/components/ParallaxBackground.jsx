import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const ParallaxBackground = ({ imageSrc, opacity = 0.5, blendMode = 'screen' }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-300, 300], [8, -8]);
  const rotateY = useTransform(x, [-300, 300], [-8, 8]);
  const translateX = useTransform(x, [-300, 300], [-20, 20]);
  const translateY = useTransform(y, [-300, 300], [-20, 20]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      x.set(e.clientX - centerX);
      y.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [x, y]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '-10%',
        left: '-10%',
        width: '120vw',
        height: '120vh',
        zIndex: -1,
        perspective: '1500px',
        pointerEvents: 'none',
      }}
    >
      <motion.img
        src={imageSrc}
        alt="Parallax background"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          transformStyle: 'preserve-3d',
          opacity: opacity,
          mixBlendMode: blendMode,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: opacity }}
        transition={{ duration: 1.5 }}
      />
    </motion.div>
  );
};

export default ParallaxBackground;
