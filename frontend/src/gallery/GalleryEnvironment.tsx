import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import { DoubleSide } from 'three';

export const GalleryEnvironment = () => {
  const particlesRef = useRef<Points>(null);

  // Floating ambient atmospheric gold dust particles (140 specks)
  const particleCount = 140;
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

      {/* Main High-CRI Warm Museum Directional Key Spotlight */}
      <directionalLight
        position={[5, 11, 7]}
        intensity={2.1}
        color="#FFF6E5"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
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
        intensity={0.95}
        color="#FFEAD0"
      />

      {/* Center Gallery Floor Warm Uplight */}
      <pointLight
        position={[0, -0.6, 1.5]}
        intensity={0.65}
        distance={6}
        color="#FFF0D4"
      />

      {/* 1. ARCHITECTURAL MUSEUM PAVILION BACKDROP (Curved Haveli Colonnade) */}
      <group position={[0, 0, -6.2]}>
        {/* Curved Sandstone Pavilion Wall */}
        <mesh position={[0, 2.8, 0]}>
          <cylinderGeometry
            args={[14, 14, 8.5, 64, 1, true, -Math.PI * 0.42, Math.PI * 0.84]}
          />
          <meshStandardMaterial
            color="#EFE9DE"
            roughness={0.88}
            metalness={0.02}
            side={DoubleSide}
          />
        </mesh>

        {/* Upper Architrave & Crown Molding Band */}
        <mesh position={[0, 6.8, 0]}>
          <cylinderGeometry
            args={[13.92, 13.92, 0.28, 64, 1, true, -Math.PI * 0.42, Math.PI * 0.84]}
          />
          <meshStandardMaterial
            color="#D9C9B4"
            roughness={0.7}
            metalness={0.1}
            side={DoubleSide}
          />
        </mesh>

        {/* Gilded Brass Filigree Inlay Trim on Pavilion Wall */}
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry
            args={[13.94, 13.94, 0.04, 64, 1, true, -Math.PI * 0.42, Math.PI * 0.84]}
          />
          <meshStandardMaterial
            color="#C89D42"
            metalness={0.75}
            roughness={0.3}
            side={DoubleSide}
          />
        </mesh>

        {/* Lower Sandstone Dado Plinth along Wall */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry
            args={[13.96, 13.96, 1.4, 64, 1, true, -Math.PI * 0.42, Math.PI * 0.84]}
          />
          <meshStandardMaterial
            color="#E6DCCE"
            roughness={0.82}
            metalness={0.04}
            side={DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. MUSEUM SANDSTONE GROUND & MARQUETRY INLAYS */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
        receiveShadow
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

