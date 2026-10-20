import { useRef, useState, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { MathUtils, DoubleSide } from 'three';
import type { Texture, Group } from 'three';
import type { CraftObject } from '../types';

interface ArtisanArtifact3DProps {
  object: CraftObject;
  isSelected: boolean;
  isAnySelected: boolean;
  onSelect: (object: CraftObject) => void;
  textureMap?: Texture | null;
}

export const ArtisanArtifact3D = ({
  object,
  isSelected,
  isAnySelected,
  onSelect,
  textureMap,
}: ArtisanArtifact3DProps) => {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Random phase offset so all floating objects don't bob in sync
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < object.id.length; i++) {
      hash = (hash << 5) - hash + object.id.charCodeAt(i);
    }
    return Math.abs(hash % 100) / 10;
  }, [object.id]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() + phaseOffset;

    // Gentle idle floating motion
    if (!isSelected) {
      const hoverBoost = hovered ? 0.18 : 0;
      const targetY = object.position3D[1] + Math.sin(t * 1.2) * 0.06 + hoverBoost;
      groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, 0.08);

      // Subtle yaw rotation
      if (meshRef.current) {
        meshRef.current.rotation.y = (object.rotation3D?.[1] || 0) + Math.sin(t * 0.6) * 0.08 + (hovered ? 0.15 : 0);
      }
    } else {
      // In selected focus mode, slowly rotate for continuous 360 inspection
      if (meshRef.current) {
        meshRef.current.rotation.y += 0.006;
      }
    }
  });

  // Opacity fading when another object is selected
  const isDimmed = isAnySelected && !isSelected;

  return (
    <group
      ref={groupRef}
      position={[object.position3D[0], object.position3D[1], object.position3D[2]]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(object);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 3D Museum Plinth / Pedestal */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.15, 48]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#FAF6EE' : '#EDE7DC'}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Brass Rim on Plinth */}
      <mesh position={[0, -1.02, 0]}>
        <cylinderGeometry args={[0.71, 0.71, 0.02, 48]} />
        <meshStandardMaterial
          color="#C6A15B"
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
      {/* Soft Plinth Glow */}
      {(hovered || isSelected) && (
        <pointLight position={[0, -0.4, 0]} intensity={1.5} distance={1.8} color="#E8D5B0" />
      )}

      {/* Main 3D Artisan Craft Geometry */}
      <group
        ref={meshRef}
        scale={isSelected ? [1.12, 1.12, 1.12] : hovered ? [1.05, 1.05, 1.05] : [1, 1, 1]}
      >
        {renderArtisanGeometry(object, textureMap, isDimmed)}
      </group>

      {/* Floating Curatorial Label */}
      {!isSelected && (
        <Html
          position={[0, -1.45, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            opacity: isDimmed ? 0.2 : hovered ? 1 : 0.85,
            transform: hovered ? 'scale(1.05) translateY(-2px)' : 'scale(1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(250, 247, 242, 0.92)',
              backdropFilter: 'blur(10px)',
              padding: '6px 14px',
              borderRadius: '24px',
              border: `1px solid ${hovered ? 'rgba(196, 98, 67, 0.4)' : 'rgba(210, 195, 175, 0.5)'}`,
              boxShadow: hovered ? '0 10px 25px rgba(28, 25, 22, 0.12)' : '0 4px 12px rgba(28, 25, 22, 0.06)',
              minWidth: '130px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#C46243',
                  letterSpacing: '0.1em',
                }}
              >
                {object.romanNumeral}
              </span>
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#1A1816',
                  letterSpacing: '0.02em',
                }}
              >
                {object.title.length > 24 ? object.title.substring(0, 22) + '…' : object.title}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '0.62rem',
                color: '#7A7268',
                letterSpacing: '0.05em',
                marginTop: '1px',
              }}
            >
              {object.craftTradition} · ₹{object.price.toLocaleString('en-IN')}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

function renderArtisanGeometry(
  object: CraftObject,
  texture: Texture | null | undefined,
  isDimmed: boolean
) {
  const dimOpacity = isDimmed ? 0.35 : 1.0;

  switch (object.modelType) {
    case 'painting':
      return (
        <group position={[0, 0, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.3, 1.65, 0.08]} />
            <meshStandardMaterial
              color="#2C1D11"
              roughness={0.65}
              metalness={0.1}
              transparent
              opacity={dimOpacity}
            />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <boxGeometry args={[1.16, 1.51, 0.02]} />
            <meshStandardMaterial
              color="#D4AF37"
              roughness={0.3}
              metalness={0.8}
              transparent
              opacity={dimOpacity}
            />
          </mesh>
          <mesh position={[0, 0, 0.058]}>
            <planeGeometry args={[1.08, 1.42]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.4}
                metalness={0.1}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#F3EAD7"
                roughness={0.5}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0, -0.85, -0.15]} rotation={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 16]} />
            <meshStandardMaterial color="#22150C" roughness={0.7} />
          </mesh>
          <mesh position={[-0.45, -0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 16]} />
            <meshStandardMaterial color="#C6A15B" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.45, -0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 16]} />
            <meshStandardMaterial color="#C6A15B" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      );

    case 'pottery':
      return (
        <group position={[0, -0.1, 0]}>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.3, 0.38, 0.12, 36]} />
            <meshStandardMaterial
              color="#0A4275"
              roughness={0.15}
              metalness={0.1}
              transparent
              opacity={dimOpacity}
            />
          </mesh>
          <mesh position={[0, -0.15, 0]} castShadow>
            <sphereGeometry args={[0.62, 36, 36]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.1}
                metalness={0.08}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#1565C0"
                roughness={0.12}
                metalness={0.1}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.24, 0.38, 0.45, 36]} />
            <meshStandardMaterial
              color="#1EA5C4"
              roughness={0.1}
              metalness={0.05}
              transparent
              opacity={dimOpacity}
            />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <torusGeometry args={[0.26, 0.04, 16, 36]} />
            <meshStandardMaterial color="#0A4275" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.78, 0]}>
            <coneGeometry args={[0.25, 0.26, 32]} />
            <meshStandardMaterial color="#0A4275" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.94, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#EBB036" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.56, 0.05, 0]} rotation={[0, 0, Math.PI / 4]}>
            <torusGeometry args={[0.22, 0.045, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#0A4275" roughness={0.15} />
          </mesh>
          <mesh position={[0.56, 0.05, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <torusGeometry args={[0.22, 0.045, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#0A4275" roughness={0.15} />
          </mesh>
        </group>
      );

    case 'textile':
      return (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.45, 24]} />
            <meshStandardMaterial color="#2B1810" roughness={0.5} />
          </mesh>
          <mesh position={[-0.73, 0.8, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0.73, 0.8, 0]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.72, 1.55, 32, 8, true, -Math.PI * 0.45, Math.PI * 0.9]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.4}
                metalness={0.25}
                side={DoubleSide}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#7A1C29"
                roughness={0.45}
                metalness={0.25}
                side={DoubleSide}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0, -0.82, 0.05]}>
            <boxGeometry args={[1.2, 0.12, 0.04]} />
            <meshStandardMaterial
              color="#DFBD76"
              metalness={0.85}
              roughness={0.2}
              transparent
              opacity={dimOpacity}
            />
          </mesh>
        </group>
      );

    case 'brass':
      return (
        <group position={[0, -0.1, 0]}>
          <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.3, 0.6, 16, 24]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.35}
                metalness={0.82}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#A07830"
                roughness={0.38}
                metalness={0.8}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0.42, 0.48, 0]} rotation={[0, 0, -Math.PI / 5]}>
            <cylinderGeometry args={[0.13, 0.22, 0.62, 16]} />
            <meshStandardMaterial color="#946F28" metalness={0.82} roughness={0.35} />
          </mesh>
          <mesh position={[0.62, 0.72, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color="#946F28" metalness={0.82} roughness={0.35} />
          </mesh>
          {[-0.32, 0.32].map((x) =>
            [-0.14, 0.14].map((z) => (
              <group key={`${x}-${z}`} position={[x, -0.4, z]}>
                <mesh>
                  <cylinderGeometry args={[0.05, 0.065, 0.75, 12]} />
                  <meshStandardMaterial color="#886420" metalness={0.85} roughness={0.35} />
                </mesh>
                <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.075, 0.02, 10, 16]} />
                  <meshStandardMaterial color="#C5A059" metalness={0.9} roughness={0.25} />
                </mesh>
              </group>
            ))
          )}
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.4]} />
            <meshStandardMaterial color="#B58E38" metalness={0.88} roughness={0.3} />
          </mesh>
          <mesh position={[-0.45, 0.1, 0]} rotation={[0, 0, Math.PI / 3]}>
            <cylinderGeometry args={[0.03, 0.06, 0.45, 12]} />
            <meshStandardMaterial color="#886420" metalness={0.85} roughness={0.35} />
          </mesh>
        </group>
      );

    case 'woodcraft':
      return (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, -0.85, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.12, 32]} />
            <meshStandardMaterial color="#2E1B10" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.45, 0]} castShadow>
            <sphereGeometry args={[0.42, 32, 32]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.18}
                metalness={0.05}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#A64B2A"
                roughness={0.2}
                metalness={0.05}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.52, 0.45, 0.08, 32]} />
            <meshStandardMaterial color="#D99B26" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.42, 0.48, 0.08, 32]} />
            <meshStandardMaterial color="#8F2D18" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.34, 0.38, 0.08, 32]} />
            <meshStandardMaterial color="#D99B26" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.26, 0.3, 0.08, 32]} />
            <meshStandardMaterial color="#2E1B10" roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <coneGeometry args={[0.2, 0.55, 32]} />
            <meshStandardMaterial color="#D99B26" roughness={0.18} />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshStandardMaterial color="#8F2D18" roughness={0.2} />
          </mesh>
        </group>
      );

    case 'jewellery':
      return (
        <group position={[0, 0.1, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <torusGeometry args={[0.22, 0.025, 16, 32]} />
            <meshStandardMaterial color="#E8C76A" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.58, 0.1, 8]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.18}
                metalness={0.9}
                transparent
                opacity={dimOpacity}
              />
            ) : (
              <meshStandardMaterial
                color="#DFBD76"
                roughness={0.2}
                metalness={0.92}
                transparent
                opacity={dimOpacity}
              />
            )}
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshStandardMaterial
              color="#0E6B47"
              roughness={0.1}
              metalness={0.15}
              transparent
              opacity={0.92}
            />
          </mesh>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i * Math.PI) / 4;
            const r = 0.38;
            return (
              <group key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.055]}>
                <mesh>
                  <cylinderGeometry args={[0.065, 0.08, 0.03, 6]} />
                  <meshStandardMaterial color="#F8F8F4" roughness={0.08} metalness={0.3} />
                </mesh>
              </group>
            );
          })}
          {[-0.32, -0.16, 0, 0.16, 0.32].map((x, idx) => (
            <group key={idx} position={[x, -0.65 - Math.abs(x) * 0.2, 0]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
                <meshStandardMaterial color="#C5A059" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.12, 0]}>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshStandardMaterial color="#FBF9F2" roughness={0.25} metalness={0.1} />
              </mesh>
            </group>
          ))}
        </group>
      );

    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#C46243" />
        </mesh>
      );
  }
}
