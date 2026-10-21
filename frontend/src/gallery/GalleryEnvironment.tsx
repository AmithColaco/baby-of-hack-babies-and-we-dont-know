import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';

export const GalleryEnvironment = () => {
  const particlesRef = useRef<Points>(null);

  // Floating ambient atmospheric gold dust particles
  const particleCount = 80;  // Reduced from 140 — halves particle draw calls
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = Math.random() * 5.5 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    particlesRef.current.rotation.y = t * 0.012;
  });

  return (
    <>
      {/* Background & Atmospheric Depth Fog */}
      <color attach="background" args={['#F9F5EE']} />
      <fog attach="fog" args={['#F9F5EE', 9, 24]} />

      {/* Warm Ambient Atelier Fill */}
      <ambientLight intensity={1.2} color="#FFFBF0" />

      {/* Key Warm Museum Spotlight — no shadow maps (handled by Canvas) */}
      <directionalLight
        position={[6, 10, 7]}
        intensity={2.0}
        color="#FFF4DE"
      />

      {/* Cool Sky Fill for Contrast */}
      <directionalLight
        position={[-6, 5, -4]}
        intensity={0.65}
        color="#E6EFF8"
      />

      {/* Rim & Back Light */}
      <directionalLight
        position={[0, 6, -8]}
        intensity={1.1}
        color="#FFE8CC"
      />

      {/* Museum Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      >
        <planeGeometry args={[65, 65]} />
        <meshStandardMaterial
          color="#F9F5EE"
          roughness={0.82}
          metalness={0.03}
        />
      </mesh>

      {/* Concentric Architectural Rings on Floor */}
      {[2.6, 5.2, 7.8, 10.8].map((radius, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.19, 0]}
        >
          <ringGeometry args={[radius, radius + 0.018, 64]} />
          <meshBasicMaterial color="#E5DAC9" transparent opacity={0.65} />
        </mesh>
      ))}

      {/* Floating Gold Leaf Dust Specks */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.032}
          color="#C89D42"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
    </>
  );
};
