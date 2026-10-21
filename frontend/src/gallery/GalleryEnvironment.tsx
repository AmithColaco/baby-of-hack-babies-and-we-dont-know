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
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 5.0 - 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    particlesRef.current.rotation.y = t * 0.01;
  });

  return (
    <>
      {/* Background & Atmospheric Depth Fog */}
      <color attach="background" args={['#F9F5EE']} />
      <fog attach="fog" args={['#F9F5EE', 8.5, 26]} />

      {/* Warm Ambient Atelier Fill */}
      <ambientLight intensity={1.15} color="#FFFDF7" />

      {/* Key Warm Museum Spotlight */}
      <directionalLight
        position={[6, 10, 7]}
        intensity={2.0}
        color="#FFF4DE"
      />

      {/* Secondary Cool Architectural Rim Light for Material Depth */}
      <directionalLight
        position={[-6, 6, -3]}
        intensity={0.65}
        color="#E8F0F8"
      />

      {/* Subtle Warm Silhouette Backlight */}
      <directionalLight
        position={[0, 6, -8]}
        intensity={1.1}
        color="#FFE8CC"
      />

      {/* Museum Ground Reflection Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
      >
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial
          color="#F9F5EE"
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>

      {/* Concentric Architectural Rings on Floor (Brass Marquetry) */}
      {[2.5, 4.2, 5.8, 7.6, 9.8].map((radius, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.196, 0]}
        >
          <ringGeometry args={[radius, radius + 0.022, 96]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#C89D42' : '#D0BEA8'}
            metalness={0.65}
            roughness={0.35}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Radial Indian Marquetry Rays extending outward from center */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            rotation={[-Math.PI / 2, 0, rad]}
            position={[0, -1.197, 0]}
          >
            <planeGeometry args={[0.018, 14]} />
            <meshStandardMaterial
              color="#DFD2C2"
              roughness={0.8}
              transparent
              opacity={0.45}
            />
          </mesh>
        );
      })}

      {/* Central Exhibition Rosette Inlay */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.195, 0]}
      >
        <circleGeometry args={[1.2, 48]} />
        <meshStandardMaterial
          color="#EDE4D4"
          roughness={0.75}
          metalness={0.08}
        />
      </mesh>

      {/* 3. FLOATING GOLD LEAF DUST PARTICLES */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.034}
          color="#D4AF37"
          transparent
          opacity={0.45}
          sizeAttenuation
        />
      </points>
    </>
  );
};
