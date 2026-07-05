import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Easing ─── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ─── Scroll-animated Model ─── */
function ScrollModel({ url, scrollProgress, onLoaded }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const baseScale = useRef(1);
  const ready = useRef(false);

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

    const p = scrollProgress.current;
    const time = state.clock.elapsedTime;

    // Scale morph: 0 → 1
    const scaleT = Math.min(p * 2.5, 1);
    const s = easeOutCubic(scaleT) * baseScale.current;
    groupRef.current.scale.setScalar(s);

    // Slide in from behind, positioning model on the right
    const posT = Math.min(p * 2.0, 1);
    groupRef.current.position.z = THREE.MathUtils.lerp(-5, 0, easeOutCubic(posT));
    groupRef.current.position.x = THREE.MathUtils.lerp(3, 1.5, easeOutCubic(posT)); // Animate in from further right to resting position on the right

    // Entrance spin + idle rotation
    const rotT = Math.min(p * 1.6, 1);
    const entrance = THREE.MathUtils.lerp(Math.PI, 0, easeOutCubic(rotT));
    const idle = p > 0.4 ? time * 0.15 : 0;
    groupRef.current.rotation.y = entrance + idle;

    // Gentle float
    groupRef.current.position.y = Math.sin(time * 0.6) * 0.04;
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
  const scrollProgress = useRef(0);

  const handleLoaded = useCallback(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const winH = window.innerHeight;
      const raw = (winH - rect.top) / (winH + rect.height * 0.3);
      scrollProgress.current = Math.max(0, Math.min(1, raw));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── 3D Canvas: absolute-fill behind all content ── */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}>
        <Canvas
          camera={{ position: [0, 0.5, 5.5], fov: 36, near: 0.1, far: 50 }}
          style={{ width: '100%', height: '100%' }}
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
            <ScrollModel
              url="/Synth+Wave+Left+Hand.glb"
              scrollProgress={scrollProgress}
              onLoaded={handleLoaded}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Foreground content on top of the 3D model ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1000px',
        width: '100%',
        padding: '4rem 2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '0 auto',
        gap: '2rem',
      }}>
        {/* Left: text content */}
        <div style={{
          flex: '1 1 360px',
          maxWidth: '480px',
          textAlign: 'left',
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
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
          }}>
            Synth Wave<br />Controller
          </h2>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-muted)',
            lineHeight: 1.75,
            marginBottom: '1.25rem',
          }}>
            A next-generation IoT music controller that transforms hand gestures
            into expressive digital sound. Engineered with precision accelerometers
            and gyroscopic sensors to capture every nuance of your movement.
          </p>
          <p style={{
            fontSize: '0.95rem',
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
        </div>

        {/* Right: empty spacer so the 3D model shows through */}
        <div style={{
          flex: '1 1 340px',
          maxWidth: '400px',
          minHeight: '320px',
        }} />
      </div>
    </section>
  );
}
