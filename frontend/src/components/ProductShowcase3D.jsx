import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Easing ─── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/* ─── Scroll-animated 3D Model ─── */
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
    baseScale.current = 2.0 / maxDim;
    scene.scale.setScalar(baseScale.current);

    const newBox = new THREE.Box3().setFromObject(scene);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    scene.position.sub(newCenter);

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

    // Entrance: scale from 0.2 → 1.0
    const scaleT = Math.min(p * 2.5, 1);
    const easedScale = easeOutCubic(scaleT);
    const s = THREE.MathUtils.lerp(0.2, 1.0, easedScale) * baseScale.current;
    groupRef.current.scale.setScalar(s);

    // Entrance: fly in from z = -8 → 0
    const posT = Math.min(p * 2.0, 1);
    const easedPos = easeOutCubic(posT);
    groupRef.current.position.z = THREE.MathUtils.lerp(-8, 0, easedPos);
    groupRef.current.position.y = THREE.MathUtils.lerp(-1, 0, easedPos);

    // Entrance rotation + gentle idle spin
    const rotT = Math.min(p * 1.8, 1);
    const entranceRot = THREE.MathUtils.lerp(Math.PI * 1.5, 0, easeOutCubic(rotT));
    const idleRot = p > 0.5 ? time * 0.2 : 0;
    groupRef.current.rotation.y = entranceRot + idleRot;

    // Subtle float
    groupRef.current.position.y += Math.sin(time * 0.7) * 0.04;
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
      <directionalLight position={[5, 8, 5]} intensity={1.8} color="#fff5e6" castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#a0c4f1" />
      <pointLight position={[0, 5, -5]} intensity={0.6} color="#7dd3fc" distance={20} decay={2} />
    </>
  );
}

/* ─── Loading Spinner ─── */
function LoadingSpinner({ visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 0.6s ease',
      }}
    >
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid rgba(14,165,233,0.12)',
        borderTopColor: '#0ea5e9',
        borderRadius: '50%',
        animation: 'model-spin 0.8s linear infinite',
      }} />
    </div>
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

  // Track scroll position relative to this section
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
        padding: '4rem 2rem',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>

        {/* Section Title */}
        <h2 style={{
          fontSize: 'var(--h2-font-size)',
          fontWeight: 800,
          color: 'var(--text-main)',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          Our Product
        </h2>

        {/* 3D Viewer + Description — side by side on desktop */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.5rem',
          width: '100%',
          marginTop: '1rem',
        }}>

          {/* 3D Canvas — no container, fully transparent */}
          <div style={{
            position: 'relative',
            width: '380px',
            height: '340px',
            flexShrink: 0,
            overflow: 'visible',
            background: 'none',
            border: 'none',
            boxShadow: 'none',
            outline: 'none',
          }}>
            <LoadingSpinner visible={isLoading} />

            <Canvas
              shadows
              camera={{ position: [0, 0.8, 4.5], fov: 40, near: 0.1, far: 50 }}
              style={{ width: '100%', height: '100%', background: 'transparent' }}
              gl={{
                antialias: true,
                alpha: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2,
                setClearColor: undefined,
              }}
              onCreated={({ gl }) => {
                gl.setClearColor(0x000000, 0);
              }}
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

          {/* Description */}
          <div style={{
            maxWidth: '420px',
            flex: '1 1 300px',
          }}>
            <h3 style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '1rem',
              lineHeight: 1.3,
            }}>
              Synth Wave Controller
            </h3>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              lineHeight: 1.75,
              marginBottom: '1.25rem',
            }}>
              A next-generation IoT music controller that transforms hand gestures into expressive
              digital sound. Engineered with precision accelerometers and gyroscopic sensors, the
              Synth Wave captures every nuance of your movement — from sweeping bows to subtle
              finger vibrato — and maps them to MIDI parameters in real time.
            </p>
            <p style={{
              fontSize: '1rem',
              color: 'var(--text-muted)',
              lineHeight: 1.75,
              marginBottom: '1.5rem',
            }}>
              Whether you're a pianist, violinist, or percussionist, this single device adapts to
              your instrument and playing style. Connect wirelessly, practice with live visual
              feedback on our web dashboard, and take your music to the next level.
            </p>

            {/* Feature tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Real-time MIDI', 'Gyro Sensors', 'Wireless', 'Multi-Instrument', 'Low Latency'].map((tag, i) => (
                <span key={i} style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
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

        </div>
      </div>

      <style>{`
        @keyframes model-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
