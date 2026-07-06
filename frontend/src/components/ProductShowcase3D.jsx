import React, { Suspense, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Easing ─── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ─── Responsive breakpoints helper ─── */
function getResponsiveConfig(width) {
  if (width < 480) {
    // Phone
    return {
      modelScale: 0.45,
      startPos: [2.5, 3, 0],
      endPos: [-0.3, 0, 0],
      cameraPos: [0, 0.3, 6],
      fov: 40,
    };
  } else if (width < 768) {
    // Large phone / small tablet
    return {
      modelScale: 0.55,
      startPos: [3, 3, 0],
      endPos: [-0.8, 0, 0],
      cameraPos: [0, 0.3, 6],
      fov: 38,
    };
  } else if (width < 1024) {
    // Tablet
    return {
      modelScale: 0.6,
      startPos: [3.5, 3.5, -2],
      endPos: [-1.0, 0, 0],
      cameraPos: [0, 0.4, 5.5],
      fov: 36,
    };
  } else {
    // Desktop
    return {
      modelScale: 0.65,
      startPos: [4, 4, -3],
      endPos: [-1.5, 0, 0],
      cameraPos: [0, 0.4, 5.5],
      fov: 36,
    };
  }
}

/* ─── Interactive Model with entrance animation + mouse rotation ─── */
function InteractiveModel({ url, scrollProgress, mouseRotation, onLoaded, responsiveConfig }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const baseScale = useRef(1);
  const ready = useRef(false);

  // Smooth mouse rotation with lerp
  const currentMouseRot = useRef({ x: 0, y: 0 });

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
    const config = responsiveConfig.current;

    // ── Entrance animation progress (0→1 based on scroll) ──
    const entranceT = Math.min(p * 2.5, 1);
    const eased = easeInOutCubic(entranceT);

    // ── Position: top-right → middle-left ──
    const startPos = config.startPos;
    const endPos = config.endPos;
    const x = THREE.MathUtils.lerp(startPos[0], endPos[0], eased);
    const y = THREE.MathUtils.lerp(startPos[1], endPos[1], eased);
    const z = THREE.MathUtils.lerp(startPos[2], endPos[2], eased);

    // ── Scale: start small, morph to target size ──
    const scaleT = Math.min(p * 2.5, 1);
    const targetScale = config.modelScale;
    const s = THREE.MathUtils.lerp(0.1, targetScale, easeOutCubic(scaleT)) * baseScale.current;
    groupRef.current.scale.setScalar(s);

    // ── Entrance rotation (spin in during entrance) ──
    const rotT = Math.min(p * 2.0, 1);
    const entranceRotY = THREE.MathUtils.lerp(Math.PI * 0.5, 0, easeOutCubic(rotT));
    const entranceRotX = THREE.MathUtils.lerp(-0.3, 0, easeOutCubic(rotT));

    // ── Smooth mouse rotation (only after entrance completes) ──
    const mouseInfluence = Math.min(Math.max((p - 0.3) / 0.2, 0), 1); // fade in mouse control
    const targetMouseX = mouseRotation.current.x * mouseInfluence;
    const targetMouseY = mouseRotation.current.y * mouseInfluence;

    currentMouseRot.current.x += (targetMouseX - currentMouseRot.current.x) * 0.08;
    currentMouseRot.current.y += (targetMouseY - currentMouseRot.current.y) * 0.08;

    // ── Gentle floating (only after settled) ──
    const time = state.clock.elapsedTime;
    const floatAmount = Math.min(p * 2, 1);
    const floatY = Math.sin(time * 0.5) * 0.03 * floatAmount;

    groupRef.current.position.set(x, y + floatY, z);
    groupRef.current.rotation.set(
      entranceRotX + currentMouseRot.current.x,
      entranceRotY + currentMouseRot.current.y,
      0
    );
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

/* ─── Camera updater for responsive ─── */
function CameraUpdater({ responsiveConfig }) {
  const { camera } = useThree();

  useFrame(() => {
    const config = responsiveConfig.current;
    camera.position.lerp(new THREE.Vector3(...config.cameraPos), 0.05);
    camera.fov = THREE.MathUtils.lerp(camera.fov, config.fov, 0.05);
    camera.updateProjectionMatrix();
  });

  return null;
}

/* ─── Main Component ─── */
export default function ProductShowcase3D() {
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef(null);
  const scrollProgress = useRef(0);
  const mouseRotation = useRef({ x: 0, y: 0 });
  const responsiveConfig = useRef(getResponsiveConfig(window.innerWidth));
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const handleLoaded = useCallback(() => {
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  // Scroll tracking
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

  // Mouse tracking for rotation (desktop) + touch (mobile)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Only respond when mouse is within the section
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;

      const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      mouseRotation.current = {
        x: -ny * 0.4,  // vertical mouse → X rotation
        y: nx * 0.6,   // horizontal mouse → Y rotation
      };
    };

    // Touch support
    const onTouchMove = (e) => {
      if (!sectionRef.current || !e.touches[0]) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch.clientY < rect.top || touch.clientY > rect.bottom) return;

      const nx = (touch.clientX / window.innerWidth - 0.5) * 2;
      const ny = (touch.clientY / window.innerHeight - 0.5) * 2;

      mouseRotation.current = {
        x: -ny * 0.4,
        y: nx * 0.6,
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
    const onResize = () => {
      const w = window.innerWidth;
      setWindowWidth(w);
      responsiveConfig.current = getResponsiveConfig(w);
    };
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
        zIndex: 1,
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
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
          camera={{ position: [0, 0.4, 5.5], fov: 36, near: 0.1, far: 50 }}
          style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
          }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <CameraUpdater responsiveConfig={responsiveConfig} />
          <Lights />
          <Suspense fallback={null}>
            <InteractiveModel
              url="/Synth+Wave+Left+Hand.glb"
              scrollProgress={scrollProgress}
              mouseRotation={mouseRotation}
              onLoaded={handleLoaded}
              responsiveConfig={responsiveConfig}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Foreground content: left-aligned ── */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '1400px',
        padding: isMobile ? '3rem 1.5rem' : isTablet ? '4rem 2.5rem' : '4rem 4rem',
        pointerEvents: 'none',
      }}>
        {/* Left: text content - aligned to left border */}
        <div style={{
          maxWidth: isMobile ? '100%' : isTablet ? '380px' : '460px',
          textAlign: 'left',
          pointerEvents: 'auto',
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

          {/* Mouse interaction hint */}
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
            {isMobile ? 'Touch & drag to rotate the 3D model' : 'Move your mouse to rotate the 3D model'}
          </p>
        </div>
      </div>
    </section>
  );
}
