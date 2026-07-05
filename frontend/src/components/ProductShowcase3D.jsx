import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Animated 3D Model — flies in from the background ─── */
function AnimatedModel({ url, onLoaded, scrollProgress }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const materialCache = useRef([]);
  const baseScale = useRef(1);
  const hasInit = useRef(false);

  useEffect(() => {
    if (!scene) return;

    // Center the model's pivot
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    scene.position.sub(center);

    // Compute fit scale
    const maxDim = Math.max(size.x, size.y, size.z);
    baseScale.current = 3.0 / maxDim;

    // Collect all mesh materials for opacity animation
    materialCache.current = [];
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Enable transparency for morph-in
        if (child.material) {
          const mat = child.material.clone();
          mat.transparent = true;
          mat.opacity = 0;
          child.material = mat;
          materialCache.current.push(mat);
        }
      }
    });

    // Re-center after scaling
    scene.scale.setScalar(baseScale.current);
    const newBox = new THREE.Box3().setFromObject(scene);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    scene.position.sub(newCenter);

    hasInit.current = true;
    if (onLoaded) onLoaded();
  }, [scene, onLoaded]);

  useFrame((state, delta) => {
    if (!groupRef.current || !hasInit.current) return;

    const p = scrollProgress.current;

    // --- Entrance animation driven by scroll ---
    // Scale: grows from 0.3 to 1.0
    const scaleT = THREE.MathUtils.clamp(p * 2.0, 0, 1);
    const easedScale = easeOutBack(scaleT);
    const s = THREE.MathUtils.lerp(0.3, 1.0, easedScale) * baseScale.current;
    groupRef.current.scale.setScalar(s);

    // Position: flies in from behind (z = -15 → 0) and slightly below (y offset)
    const posT = THREE.MathUtils.clamp(p * 1.8, 0, 1);
    const easedPos = easeOutCubic(posT);
    groupRef.current.position.z = THREE.MathUtils.lerp(-12, 0, easedPos);
    groupRef.current.position.y = THREE.MathUtils.lerp(-2, 0, easedPos);

    // Rotation: dramatic spin-in on Y axis
    const rotT = THREE.MathUtils.clamp(p * 1.5, 0, 1);
    const easedRot = easeOutCubic(rotT);
    const entranceRotation = THREE.MathUtils.lerp(Math.PI * 2, 0, easedRot);

    // Add gentle continuous idle rotation after entrance
    const idleRotation = p >= 0.7 ? state.clock.elapsedTime * 0.15 : 0;
    groupRef.current.rotation.y = entranceRotation + idleRotation;

    // Opacity: fade from 0 to 1
    const opacityT = THREE.MathUtils.clamp((p - 0.05) * 3.0, 0, 1);
    materialCache.current.forEach((mat) => {
      mat.opacity = opacityT;
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ─── Easing functions ─── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/* ─── Floating Particles (ambient depth) ─── */
function FloatingParticles({ count = 60, scrollProgress }) {
  const meshRef = useRef();
  const positions = useRef(new Float32Array(count * 3));
  const speeds = useRef(new Float32Array(count));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 20;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 15;
      speeds.current[i] = 0.1 + Math.random() * 0.3;
    }
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArray = geo.attributes.position.array;
    const t = state.clock.elapsedTime;
    const p = scrollProgress.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3 + 1] = positions.current[i3 + 1] + Math.sin(t * speeds.current[i] + i) * 0.5;
      posArray[i3] = positions.current[i3] + Math.cos(t * speeds.current[i] * 0.7 + i) * 0.3;
    }
    geo.attributes.position.needsUpdate = true;

    // Particles fade in with scroll
    meshRef.current.material.opacity = THREE.MathUtils.clamp(p * 2, 0, 0.4);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions.current}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#38bdf8"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Studio Lighting ─── */
function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.5} color="#d0e0f0" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.0}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#a0c4f1" />
      <pointLight position={[0, 6, -5]} intensity={0.7} color="#a8d8ff" distance={20} decay={2} />
      <pointLight position={[0, -3, 3]} intensity={0.25} color="#c0d0e0" distance={15} decay={2} />
      {/* Dramatic rim light */}
      <spotLight
        position={[-5, 5, -3]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.6}
        color="#7dd3fc"
        castShadow={false}
      />
    </>
  );
}

/* ─── Loading Overlay ─── */
function LoadingOverlay({ visible }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          border: '3px solid rgba(14, 165, 233, 0.15)',
          borderTopColor: '#0ea5e9',
          borderRadius: '50%',
          animation: 'model-spinner 0.8s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '1rem',
          color: 'rgba(14, 165, 233, 0.6)',
          fontSize: '0.8rem',
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        Loading 3D Model…
      </p>
    </div>
  );
}

/* ─── Main ProductShowcase3D Component ─── */
export default function ProductShowcase3D() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const sectionRef = useRef(null);
  const scrollProgress = useRef(0);
  const controlsRef = useRef();
  const interactionTimeout = useRef(null);

  const handleLoaded = useCallback(() => {
    setTimeout(() => setIsLoading(false), 400);
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    interactionTimeout.current = setTimeout(() => setIsInteracting(false), 3000);
  }, []);

  // Scroll-based animation driver
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      // Progress: 0 when section enters viewport bottom, 1 when section top reaches middle
      const raw = (windowH - rect.top) / (windowH + rect.height * 0.4);
      scrollProgress.current = Math.max(0, Math.min(1, raw));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial calculation
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: 'var(--h2-font-size)',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: '0.75rem',
          }}
        >
          Our Product
        </h2>
        <p
          style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            maxWidth: '550px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}
        >
          Explore the Synth Wave controller in full 3D. Drag to rotate, scroll to zoom.
        </p>
      </div>

      {/* Full-bleed transparent 3D Canvas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          height: '60vh',
          minHeight: '400px',
        }}
      >
        <LoadingOverlay visible={isLoading} />

        <Canvas
          shadows
          camera={{ position: [0, 1.5, 6], fov: 42, near: 0.1, far: 100 }}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3,
          }}
        >
          <StudioLights />
          <FloatingParticles scrollProgress={scrollProgress} />

          <Suspense fallback={null}>
            <AnimatedModel
              url="/Synth+Wave+Left+Hand.glb"
              onLoaded={handleLoaded}
              scrollProgress={scrollProgress}
            />
            <ContactShadows
              position={[0, -1.6, 0]}
              opacity={0.35}
              scale={12}
              blur={2.5}
              far={4}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={10}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.8}
            dampingFactor={0.06}
            enableDamping={true}
            onStart={handleInteractionStart}
            onEnd={handleInteractionEnd}
          />
        </Canvas>

        {/* Interaction hint */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '20px',
            background: 'rgba(14, 165, 233, 0.06)',
            border: '1px solid rgba(14, 165, 233, 0.12)',
            color: 'var(--text-muted)',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            pointerEvents: 'none',
            opacity: isLoading ? 0 : 0.7,
            transition: 'opacity 0.5s ease',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 9l4 4L5 17" /><path d="M19 9l-4 4 4 4" />
          </svg>
          Drag to rotate · Scroll to zoom
        </div>
      </div>

      {/* Feature Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          marginTop: '2.5rem',
          maxWidth: '900px',
          width: '100%',
          padding: '0 1rem',
        }}
      >
        {[
          {
            icon: '🎹',
            title: 'Smart Piano Controller',
            desc: 'IoT-enabled keys with tactile feedback and real-time MIDI synthesis.',
          },
          {
            icon: '🎻',
            title: 'Gyro Bow Sensor',
            desc: 'Tracks meend, vibrato, and velocity on any traditional violin bow.',
          },
          {
            icon: '🥁',
            title: 'USB Kick & Pads',
            desc: 'Zero-latency percussion pads with dynamic velocity sensing.',
          },
        ].map((item, i) => (
          <div
            key={i}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.55)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(14, 165, 233, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Spinner keyframes */}
      <style>{`
        @keyframes model-spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
