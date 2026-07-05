import React, { Suspense, useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Easing helpers ─── */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* ─── Scroll-animated 3D Model ─── */
function ScrollModel({ url, scrollY, onLoaded }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const baseScale = useRef(1);
  const initialized = useRef(false);

  useEffect(() => {
    if (!scene) return;

    // Center pivot
    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    scene.position.sub(center);

    // Scale to fit
    const maxDim = Math.max(size.x, size.y, size.z);
    baseScale.current = 2.5 / maxDim;
    scene.scale.setScalar(baseScale.current);

    // Re-center after scale
    const newBox = new THREE.Box3().setFromObject(scene);
    const newCenter = newBox.getCenter(new THREE.Vector3());
    scene.position.sub(newCenter);

    // Material setup
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    initialized.current = true;
    if (onLoaded) onLoaded();
  }, [scene, onLoaded]);

  useFrame((state) => {
    if (!groupRef.current || !initialized.current) return;

    const pageH = document.documentElement.scrollHeight - window.innerHeight;
    const rawProgress = pageH > 0 ? scrollY.current / pageH : 0;
    const p = Math.max(0, Math.min(1, rawProgress));

    // --- Scroll-driven keyframed animation ---
    // The model transitions through poses as you scroll:
    //
    // 0.0 - 0.15 : Far right, small, tilted — peeking in
    // 0.15 - 0.4 : Slides to center, grows, straightens — hero reveal
    // 0.4 - 0.7  : Slow rotation, slight float — ambient presence
    // 0.7 - 1.0  : Drifts left and shrinks — exit

    let x, y, z, rotY, rotX, scale;

    if (p < 0.15) {
      // Phase 1: peek from right
      const t = easeInOutCubic(p / 0.15);
      x = lerp(5, 3.5, t);
      y = lerp(-1, -0.5, t);
      z = lerp(-4, -2, t);
      rotY = lerp(-0.8, -0.4, t);
      rotX = lerp(0.15, 0.1, t);
      scale = lerp(0.4, 0.6, t);
    } else if (p < 0.4) {
      // Phase 2: sweep to center — the big reveal
      const t = easeInOutCubic((p - 0.15) / 0.25);
      x = lerp(3.5, 0, t);
      y = lerp(-0.5, 0, t);
      z = lerp(-2, 0, t);
      rotY = lerp(-0.4, 0, t);
      rotX = lerp(0.1, 0.05, t);
      scale = lerp(0.6, 1.0, t);
    } else if (p < 0.7) {
      // Phase 3: centered, gentle ambient rotation
      const t = (p - 0.4) / 0.3;
      x = 0;
      y = lerp(0, 0.3, Math.sin(t * Math.PI));
      z = 0;
      rotY = t * Math.PI * 0.6; // slow rotation
      rotX = 0.05;
      scale = 1.0;
    } else {
      // Phase 4: drift left and shrink out
      const t = easeInOutCubic((p - 0.7) / 0.3);
      x = lerp(0, -4, t);
      y = lerp(0, -0.5, t);
      z = lerp(0, -3, t);
      rotY = lerp(Math.PI * 0.6, Math.PI * 0.8, t);
      rotX = lerp(0.05, 0.1, t);
      scale = lerp(1.0, 0.5, t);
    }

    // Add subtle continuous float
    const time = state.clock.elapsedTime;
    const floatY = Math.sin(time * 0.6) * 0.08;
    const floatRot = Math.sin(time * 0.4) * 0.02;

    groupRef.current.position.set(x, y + floatY, z);
    groupRef.current.rotation.set(rotX, rotY + floatRot, 0);
    groupRef.current.scale.setScalar(scale * baseScale.current);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ─── Studio Lighting ─── */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#d0e0f5" />
      <directionalLight position={[5, 8, 5]} intensity={1.6} color="#fff5e6" castShadow />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#a0c4f1" />
      <pointLight position={[0, 6, -5]} intensity={0.5} color="#7dd3fc" distance={20} decay={2} />
      <pointLight position={[0, -3, 3]} intensity={0.2} color="#c0d0e0" distance={15} decay={2} />
    </>
  );
}

/* ─── Main Background3D Component ─── */
export default function Background3D() {
  const scrollY = useRef(0);
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 1, 6], fov: 45, near: 0.1, far: 100 }}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Lights />
        <Suspense fallback={null}>
          <ScrollModel
            url="/Synth+Wave+Left+Hand.glb"
            scrollY={scrollY}
            onLoaded={handleLoaded}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
