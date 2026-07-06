import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Mouse-rotatable Model (sits on the right side) ─── */
function RotatableModel({ url, mouseRotation, onLoaded }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const baseScale = useRef(1);
  const ready = useRef(false);
  const currentRot = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    scene.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    baseScale.current = 1.0 / maxDim;
    scene.scale.setScalar(baseScale.current);

    const newBox = new THREE.Box3().setFromObject(scene);
    scene.position.sub(newBox.getCenter(new THREE.Vector3()));

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    ready.current = true;
    if (onLoaded) onLoaded();
  }, [scene, onLoaded]);

  useFrame((state) => {
    if (!groupRef.current || !ready.current) return;

    const time = state.clock.elapsedTime;

    // Smooth lerp towards target mouse rotation
    currentRot.current.x += (mouseRotation.current.x - currentRot.current.x) * 0.06;
    currentRot.current.y += (mouseRotation.current.y - currentRot.current.y) * 0.06;

    // Gentle idle float
    const floatY = Math.sin(time * 0.5) * 0.05;

    groupRef.current.position.y = floatY;
    groupRef.current.rotation.set(currentRot.current.x, currentRot.current.y, 0);
    
    // Scale up the model significantly so it looks good as the hero graphic
    groupRef.current.scale.setScalar(baseScale.current * 1.8); 
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ─── Lighting ─── */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} color="#d0e0f0" />
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#fff5e6" />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#a0c4f1" />
      <pointLight position={[0, 5, -5]} intensity={0.6} color="#7dd3fc" distance={20} decay={2} />
    </>
  );
}

/* ─── Main Component ─── */
export default function ProductShowcase3D() {
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef(null);
  const mouseRotation = useRef({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  const handleLoaded = useCallback(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Mouse / touch tracking for rotation
  useEffect(() => {
    const onMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      mouseRotation.current = {
        x: -ny * 0.35,
        y: nx * 0.5,
      };
    };

    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      const touch = e.touches[0];
      const nx = (touch.clientX / window.innerWidth - 0.5) * 2;
      const ny = (touch.clientY / window.innerHeight - 0.5) * 2;
      mouseRotation.current = {
        x: -ny * 0.35,
        y: nx * 0.5,
      };
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  // Resize tracking
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '80vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      {/* ── Left side: Text content ── */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        flex: isMobile ? 'none' : '0 0 45%',
        width: isMobile ? '100%' : '45%',
        padding: isMobile ? '2.5rem 1.5rem 1rem' : isTablet ? '3rem 2.5rem' : '4rem 4rem',
      }}>
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--primary)',
          marginBottom: '0.75rem',
        }}>
          Introducing
        </p>
        <h2 style={{
          fontSize: isMobile ? '1.8rem' : isTablet ? '2.2rem' : 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 800,
          color: 'var(--text-main)',
          lineHeight: 1.15,
          marginBottom: '1.25rem',
        }}>
          Synth Wave<br />Controller
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'var(--text-muted)',
          lineHeight: 1.75,
          marginBottom: '1.25rem',
        }}>
          A next-generation IoT music controller that transforms hand gestures
          into expressive digital sound. Engineered with precision accelerometers
          and gyroscopic sensors to capture every nuance of your movement.
        </p>
        <p style={{
          fontSize: isMobile ? '0.85rem' : '0.95rem',
          color: 'var(--text-muted)',
          lineHeight: 1.75,
          marginBottom: '1.5rem',
        }}>
          Whether you're a pianist, violinist, or percussionist — connect wirelessly,
          practice with live visual feedback, and take your music to the next level.
        </p>

        {/* Feature tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['Real-time MIDI', 'Gyro Sensors', 'Wireless', 'Multi-Instrument', 'Low Latency'].map((tag, i) => (
            <span key={i} style={{
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              background: 'rgba(14, 165, 233, 0.08)',
              color: 'var(--primary)',
              border: '1px solid rgba(14, 165, 233, 0.15)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Interaction hint */}
        <p style={{
          marginTop: '1.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span style={{ fontSize: '1rem' }}>↕↔</span>
          {isMobile ? 'Touch to rotate the 3D model' : 'Move your mouse to rotate the 3D model'}
        </p>
      </div>

      {/* ── Right side: 3D Canvas ── */}
      <div style={{
        position: 'relative',
        flex: isMobile ? 'none' : '1',
        width: isMobile ? '100%' : '55%',
        minHeight: isMobile ? '350px' : '600px', 
        zIndex: 20,
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}>
        <Canvas
          camera={{
            position: [0, 0, isMobile ? 3 : 2], // moved camera closer
            fov: isMobile ? 45 : 30, // smaller FOV for a flatter, closer look
            near: 0.1,
            far: 50,
          }}
          style={{ width: '100%', height: '100%', touchAction: 'none' }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Lights />
          <Suspense fallback={null}>
            <RotatableModel
              url="/Synth+Wave+Left+Hand.glb"
              mouseRotation={mouseRotation}
              onLoaded={handleLoaded}
            />
          </Suspense>
        </Canvas>
      </div>
    </section>
  );
}
