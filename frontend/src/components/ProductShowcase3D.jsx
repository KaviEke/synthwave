import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Clone } from '@react-three/drei';
import * as THREE from 'three';

/* ─── 3D Model Component ─── */
function Model({ url, position = [0, 0, 0], onLoaded, customScale = 1.6 }) {
  const { scene } = useGLTF(url);
  const [modelProps, setModelProps] = useState(null);

  useEffect(() => {
    if (scene) {
      // Calculate original bounds without mutating the shared scene object
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = customScale / maxDim;

      setModelProps({
        scale: scale,
        offsetX: -center.x * scale,
        offsetY: -center.y * scale,
        offsetZ: -center.z * scale
      });

      if (onLoaded) onLoaded();
    }
  }, [scene, onLoaded, customScale]);

  if (!modelProps) return null;

  return (
    <group position={position}>
      <group position={[modelProps.offsetX, modelProps.offsetY, modelProps.offsetZ]} scale={modelProps.scale}>
        <Clone object={scene} castShadow receiveShadow />
      </group>
    </group>
  );
}

/* ─── Auto-Rotate Controller ─── */
function AutoRotate({ controlsRef, isInteracting }) {
  useFrame(() => {
    if (controlsRef.current && !isInteracting) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 1.2;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });
  return null;
}

/* ─── Studio Lighting ─── */
function StudioLights() {
  return (
    <>
      {/* Soft ambient fill */}
      <ambientLight intensity={0.6} color="#e0e8f0" />

      {/* Key light — warm directional */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.8}
        color="#fff5e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* Fill light — cool blue */}
      <directionalLight
        position={[-4, 3, -3]}
        intensity={0.6}
        color="#b0d4f1"
      />

      {/* Rim/highlight point light */}
      <pointLight
        position={[0, 5, -5]}
        intensity={0.8}
        color="#a8d8ff"
        distance={20}
        decay={2}
      />

      {/* Subtle bottom fill */}
      <pointLight
        position={[0, -3, 2]}
        intensity={0.3}
        color="#c0d0e0"
        distance={15}
        decay={2}
      />
    </>
  );
}

/* ─── Loading Spinner Overlay ─── */
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
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 'inherit',
      }}
    >
      {/* Spinner ring */}
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(14, 165, 233, 0.15)',
          borderTopColor: '#0ea5e9',
          borderRadius: '50%',
          animation: 'model-spinner 0.8s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: '1.2rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.85rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
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
  const controlsRef = useRef();
  const interactionTimeout = useRef(null);

  const handleLoaded = useCallback(() => {
    // Small delay to ensure first frame renders before fade-out
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    // Resume auto-rotate after 3 seconds of inactivity
    if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    interactionTimeout.current = setTimeout(() => setIsInteracting(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (interactionTimeout.current) clearTimeout(interactionTimeout.current);
    };
  }, []);

  return (
    <section
      style={{
        padding: 'var(--section-padding-large)',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontSize: 'var(--h2-font-size)',
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: '1rem',
              textTransform: 'uppercase',
            }}
          >
            Experience The Build
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              color: 'white',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            Explore the Synth Wave controller in full 3D. Drag to rotate, scroll to zoom, and see every detail of the craft.
          </p>
        </div>

        {/* 3D Viewer Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
            margin: '0 auto',
            aspectRatio: '16 / 10',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            boxShadow: '0 25px 60px rgba(14, 165, 233, 0.15), 0 0 0 1px rgba(14, 165, 233, 0.1)',
          }}
        >
          {/* Loading overlay */}
          <LoadingOverlay visible={isLoading} />

          {/* Three.js Canvas */}
          <Canvas
            shadows
            camera={{ position: [0, 1.5, 5], fov: 45, near: 0.1, far: 100 }}
            style={{ width: '100%', height: '100%' }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2,
            }}
          >
            <StudioLights />

            <Suspense fallback={null}>
              <Model
                url="/Synth+Wave+Left+Hand.glb"
                position={[-1.3, 0, 0]}
                onLoaded={handleLoaded}
              />
              <Model
                url="/SynthWave.glb"
                position={[1.3, 0, 0]}
                onLoaded={handleLoaded}
              />
              <ContactShadows
                position={[0, -1.5, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4}
              />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.8}
              dampingFactor={0.08}
              enableDamping={true}
              onStart={handleInteractionStart}
              onEnd={handleInteractionEnd}
            />

            <AutoRotate
              controlsRef={controlsRef}
              isInteracting={isInteracting}
            />
          </Canvas>

          {/* Interaction hint badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              pointerEvents: 'none',
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.5s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.3" />
              <path d="M12 8v8M8 12h8" />
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
            marginTop: '3rem',
            maxWidth: '900px',
            margin: '3rem auto 0',
          }}
        >
          {[1, 2, 3].map((item, i) => (
            <div
              key={i}
              className="glass-panel"
              style={{
                height: '240px',
                padding: '1rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden'
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
              <Canvas
                camera={{ position: [0, 1.5, 4], fov: 45 }}
                style={{ width: '100%', height: '100%' }}
              >
                <ambientLight intensity={0.6} color="#e0e8f0" />
                <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff5e6" />
                <Suspense fallback={null}>
                  <Model url="/SynthWave.glb" customScale={2.6} />
                </Suspense>
                <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={2.5} />
              </Canvas>
            </div>
          ))}
        </div>
      </div>

      {/* Spinner keyframes injected once */}
      <style>{`
        @keyframes model-spinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
