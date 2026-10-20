import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';

export const GalleryEnvironment = () => {
  const particlesRef = useRef<Points>(null);

  const particleCount = 120;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = Math.random() * 5 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const t = state.clock.getElapsedTime();
    particlesRef.current.rotation.y = t * 0.015;
  });

  return (
    <>
      <color attach="background" args={['#FAF7F2']} />
      <fog attach="fog" args={['#FAF7F2', 8, 22]} />

      <ambientLight intensity={1.15} color="#FFFDF7" />

      <directionalLight
        position={[6, 9, 7]}
        intensity={1.8}
        color="#FFF6E8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-6, 4, -4]}
        intensity={0.65}
        color="#E4EDF5"
      />

      <directionalLight
        position={[0, 6, -8]}
        intensity={0.9}
        color="#FFEAD0"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.18, 0]}
        receiveShadow
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#FAF7F2"
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      {[2.5, 5.0, 7.5, 10.5].map((radius, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.175, 0]}
        >
          <ringGeometry args={[radius, radius + 0.015, 64]} />
          <meshBasicMaterial color="#E8DFD0" transparent opacity={0.6} />
        </mesh>
      ))}

      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#C6A15B"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>
    </>
  );
};
