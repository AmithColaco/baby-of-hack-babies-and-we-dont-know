import { useRef, useState, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
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
  const modelPivotRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Deterministic phase offset so floating animations are subtly staggered
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < object.id.length; i++) {
      hash = (hash << 5) - hash + object.id.charCodeAt(i);
    }
    return Math.abs(hash % 100) / 15;
  }, [object.id]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() + phaseOffset;

    if (!isSelected) {
      // Gentle floating levitation above museum pedestal
      const hoverElevate = hovered ? 0.12 : 0;
      const targetY = object.position3D[1] + Math.sin(t * 1.1) * 0.04 + hoverElevate;
      groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, targetY, 0.06);

      // Subtle yaw idle breathing
      if (modelPivotRef.current) {
        const baseRot = object.rotation3D?.[1] || 0;
        const targetRot = baseRot + Math.sin(t * 0.5) * 0.06 + (hovered ? 0.15 : 0);
        modelPivotRef.current.rotation.y = MathUtils.lerp(modelPivotRef.current.rotation.y, targetRot, 0.05);
      }
    } else {
      // Selected focus: slow continuous 360 degree turntable rotation for connoisseur inspection
      if (modelPivotRef.current) {
        modelPivotRef.current.rotation.y += 0.005;
      }
    }
  });

  const isDimmed = isAnySelected && !isSelected;
  const dimOpacity = isDimmed ? 0.28 : 1.0;

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
      {/* 1. Museum Pedestal / Plinth */}
      <group position={[0, -1.05, 0]}>
        {/* Tiered Sandstone Base */}
        <mesh position={[0, -0.12, 0]} receiveShadow>
          <cylinderGeometry args={[0.78, 0.84, 0.14, 48]} />
          <meshStandardMaterial
            color={isSelected || hovered ? '#F5EFE4' : '#ECE5D6'}
            roughness={0.75}
            metalness={0.04}
          />
        </mesh>

        {/* Polished Teak Inset */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.1, 48]} />
          <meshStandardMaterial
            color="#2A1B12"
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>

        {/* Beaten Brass Rim */}
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.725, 0.725, 0.015, 48]} />
          <meshStandardMaterial
            color="#C89D42"
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Accession Plaque on Pedestal Face */}
        <mesh position={[0, -0.06, 0.76]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.32, 0.08, 0.015]} />
          <meshStandardMaterial
            color="#D4AF37"
            metalness={0.88}
            roughness={0.22}
          />
        </mesh>

        {/* Spotlight illumination on active piece */}
        {(hovered || isSelected) && (
          <pointLight
            position={[0, 0.5, 0]}
            intensity={1.8}
            distance={2.5}
            color="#FFF4D8"
          />
        )}
      </group>

      {/* 2. Sculpted Masterpiece 3D Geometry */}
      <group
        ref={modelPivotRef}
        scale={isSelected ? [1.14, 1.14, 1.14] : hovered ? [1.05, 1.05, 1.05] : [1, 1, 1]}
      >
        {renderSculptedMasterwork(object, textureMap, dimOpacity)}
      </group>
    </group>
  );
};

/* ============================================================
   ARCHITECTURAL & ARTISAN 3D GEOMETRY BUILDER
   High fidelity forms for each Indian Craft Tradition
   ============================================================ */

function renderSculptedMasterwork(
  object: CraftObject,
  texture: Texture | null | undefined,
  opacity: number
) {
  switch (object.modelType) {
    /* ------------------------------------------------------------
       I. PA обще MINIATURE PAINTING (Kangra Wasli Kalam)
       Carved teak frame, gold leaf inner fillet, burnished wasli
       ------------------------------------------------------------ */
    case 'painting':
      return (
        <group position={[0, 0.05, 0]}>
          {/* Main Carved Teak Outer Frame */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.36, 1.74, 0.08]} />
            <meshStandardMaterial
              color="#24140A"
              roughness={0.55}
              metalness={0.12}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Stepped Frame Bevel */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.26, 1.64, 0.04]} />
            <meshStandardMaterial
              color="#382113"
              roughness={0.5}
              metalness={0.1}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* 24K Beaten Gold Leaf Inner Fillet (Varq) */}
          <mesh position={[0, 0, 0.048]}>
            <boxGeometry args={[1.14, 1.52, 0.015]} />
            <meshStandardMaterial
              color="#DFBA4E"
              roughness={0.25}
              metalness={0.85}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Hand-layered Wasli Paper Painting Face */}
          <mesh position={[0, 0, 0.058]}>
            <planeGeometry args={[1.06, 1.44]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.35}
                metalness={0.08}
                transparent
                opacity={opacity}
              />
            ) : (
              <meshStandardMaterial
                color="#F0E8D5"
                roughness={0.45}
                transparent
                opacity={opacity}
              />
            )}
          </mesh>

          {/* Glazing Glass Reflection Plane */}
          <mesh position={[0, 0, 0.062]}>
            <planeGeometry args={[1.06, 1.44]} />
            <meshPhysicalMaterial
              color="#FFFFFF"
              roughness={0.05}
              transmission={0.94}
              thickness={0.05}
              transparent
              opacity={0.35 * opacity}
            />
          </mesh>

          {/* Reverse Side Teak Backing & Archival Seal */}
          <mesh position={[0, 0, -0.042]}>
            <planeGeometry args={[1.34, 1.72]} />
            <meshStandardMaterial
              color="#1E1108"
              roughness={0.8}
              side={DoubleSide}
            />
          </mesh>

          {/* Brass Suspension Rings on Top */}
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, 0.88, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.04, 0.01, 16, 24]} />
              <meshStandardMaterial color="#C89D42" metalness={0.85} roughness={0.25} />
            </mesh>
          ))}
        </group>
      );

    /* ------------------------------------------------------------
       II. JAIPUR BLUE POTTERY (Glazed Quartz Crystal Urn)
       Baluster body, flanged lip, domed finial lid, cobalt glaze
       ------------------------------------------------------------ */
    case 'pottery':
      return (
        <group position={[0, -0.05, 0]}>
          {/* Fluted Ceramic Foot Base */}
          <mesh position={[0, -0.7, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.44, 0.14, 48]} />
            <meshStandardMaterial
              color="#0A3C6B"
              roughness={0.12}
              metalness={0.15}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Gilded Foot Ring */}
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.025, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Swelling Baluster Urn Body */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <sphereGeometry args={[0.66, 48, 48]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.1}
                metalness={0.12}
                transparent
                opacity={opacity}
              />
            ) : (
              <meshStandardMaterial
                color="#0D47A1"
                roughness={0.12}
                metalness={0.15}
                transparent
                opacity={opacity}
              />
            )}
          </mesh>

          {/* Tapered Neck with Persian Arabesque Glaze */}
          <mesh position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.26, 0.42, 0.52, 48]} />
            <meshStandardMaterial
              color="#1E88E5"
              roughness={0.08}
              metalness={0.1}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Molded Flanged Lip */}
          <mesh position={[0, 0.7, 0]}>
            <torusGeometry args={[0.28, 0.045, 24, 48]} />
            <meshStandardMaterial color="#0A3C6B" roughness={0.1} />
          </mesh>

          {/* Domed Finial Lid */}
          <mesh position={[0, 0.82, 0]}>
            <coneGeometry args={[0.28, 0.28, 48]} />
            <meshStandardMaterial color="#0A3C6B" roughness={0.12} />
          </mesh>

          {/* 24K Gold Finial Stupa Peak */}
          <mesh position={[0, 0.98, 0]}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#E8C045" metalness={0.9} roughness={0.18} />
          </mesh>

          {/* Twin Acanthus Loop Handles */}
          {[-1, 1].map((sign) => (
            <group key={sign} position={[sign * 0.6, 0.02, 0]} rotation={[0, 0, sign * Math.PI / 4]}>
              <mesh>
                <torusGeometry args={[0.24, 0.048, 20, 36, Math.PI * 1.1]} />
                <meshStandardMaterial color="#0A3C6B" roughness={0.12} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      );

    /* ------------------------------------------------------------
       III. CHANDERI HANDWOVEN SILK (Gossamer Royal Brocade)
       Rosewood hanging rod, brass finials, draped wave silk, zari hem
       ------------------------------------------------------------ */
    case 'textile':
      return (
        <group position={[0, 0, 0]}>
          {/* Handcrafted Rosewood Suspension Dowel */}
          <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 1.52, 32]} />
            <meshStandardMaterial color="#2B1408" roughness={0.45} />
          </mesh>

          {/* Turned Brass Rod Finials */}
          {[-0.78, 0.78].map((x) => (
            <group key={x} position={[x, 0.86, 0]}>
              <mesh>
                <sphereGeometry args={[0.065, 24, 24]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
              </mesh>
              <mesh position={[x > 0 ? 0.04 : -0.04, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.04, 0.08, 20]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
              </mesh>
            </group>
          ))}

          {/* Draped Gossamer Mulberry Silk Body with Acoustic Ripple */}
          <mesh position={[0, -0.02, 0]} castShadow>
            <cylinderGeometry
              args={[0.62, 0.78, 1.62, 48, 12, true, -Math.PI * 0.42, Math.PI * 0.84]}
            />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.32}
                metalness={0.22}
                side={DoubleSide}
                transparent
                opacity={opacity}
              />
            ) : (
              <meshStandardMaterial
                color="#6B1420"
                roughness={0.35}
                metalness={0.25}
                side={DoubleSide}
                transparent
                opacity={opacity}
              />
            )}
          </mesh>

          {/* Real Silver Electroplated Gold Zari Border (Pallu) */}
          <mesh position={[0, -0.84, 0.06]}>
            <boxGeometry args={[1.28, 0.16, 0.04]} />
            <meshStandardMaterial
              color="#DFBD76"
              metalness={0.88}
              roughness={0.2}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Hanging Gold Silk Tassels along Lower Hem */}
          {[-0.45, -0.22, 0, 0.22, 0.45].map((x) => (
            <group key={x} position={[x, -0.96, 0.06]}>
              <mesh>
                <cylinderGeometry args={[0.006, 0.006, 0.12, 8]} />
                <meshStandardMaterial color="#C89D42" metalness={0.8} />
              </mesh>
              <mesh position={[0, -0.08, 0]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshStandardMaterial color="#DFBD76" metalness={0.85} />
              </mesh>
            </group>
          ))}
        </group>
      );

    /* ------------------------------------------------------------
       IV. BASTAR DHOKRA LOST-WAX BRONZE (Ceremonial Guardian Horse)
       4,000-year Harappan cire-perdue cast, filigree ribs, saddle
       ------------------------------------------------------------ */
    case 'brass':
      return (
        <group position={[0, -0.1, 0]}>
          {/* Tubular Cast Bell-Metal Torso */}
          <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.28, 0.68, 20, 32]} />
            <meshStandardMaterial
              color="#9C752B"
              metalness={0.86}
              roughness={0.34}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Extruded Wax Wire Filigree Rings along Body */}
          {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.285, 0.018, 12, 32]} />
              <meshStandardMaterial color="#BCA058" metalness={0.88} roughness={0.3} />
            </mesh>
          ))}

          {/* Elongated Bastar Neck */}
          <mesh position={[0.44, 0.48, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <cylinderGeometry args={[0.12, 0.2, 0.65, 24]} />
            <meshStandardMaterial color="#946F28" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Crested Archival Mane */}
          <mesh position={[0.42, 0.62, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <boxGeometry args={[0.03, 0.48, 0.18]} />
            <meshStandardMaterial color="#B08D38" metalness={0.88} roughness={0.3} />
          </mesh>

          {/* Muzzle & Sculpted Head */}
          <mesh position={[0.66, 0.74, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <coneGeometry args={[0.15, 0.32, 20]} />
            <meshStandardMaterial color="#946F28" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Tribal Ears */}
          {[-0.08, 0.08].map((z) => (
            <mesh key={z} position={[0.62, 0.9, z]} rotation={[0, 0, Math.PI / 6]}>
              <coneGeometry args={[0.04, 0.15, 12]} />
              <meshStandardMaterial color="#BCA058" metalness={0.88} roughness={0.3} />
            </mesh>
          ))}

          {/* Ceremonial Saddle with Medallion */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.38, 0.08, 0.36]} />
            <meshStandardMaterial color="#C59B3C" metalness={0.9} roughness={0.28} />
          </mesh>

          {/* Slender Ritual Legs with Flared Hooves */}
          {[-0.34, 0.34].map((x) =>
            [-0.14, 0.14].map((z) => (
              <group key={`${x}-${z}`} position={[x, -0.42, z]}>
                <mesh>
                  <cylinderGeometry args={[0.048, 0.065, 0.78, 16]} />
                  <meshStandardMaterial color="#886420" metalness={0.86} roughness={0.36} />
                </mesh>
                <mesh position={[0, -0.38, 0]}>
                  <cylinderGeometry args={[0.08, 0.09, 0.06, 16]} />
                  <meshStandardMaterial color="#B58E38" metalness={0.9} roughness={0.28} />
                </mesh>
              </group>
            ))
          )}

          {/* Braided Bronze Tail */}
          <mesh position={[-0.48, 0.08, 0]} rotation={[0, 0, Math.PI / 3]}>
            <cylinderGeometry args={[0.025, 0.05, 0.48, 12]} />
            <meshStandardMaterial color="#886420" metalness={0.86} roughness={0.36} />
          </mesh>
        </group>
      );

    /* ------------------------------------------------------------
       V. CHANNAPATNA LACQUER WOOD (Temple Shikhara Totem)
       Ivory wood lathe turning, vegetable lac frictional gloss
       ------------------------------------------------------------ */
    case 'woodcraft':
      return (
        <group position={[0, 0.08, 0]}>
          {/* Rosewood Foundation Base */}
          <mesh position={[0, -0.84, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.44, 0.14, 48]} />
            <meshStandardMaterial color="#28150B" roughness={0.35} />
          </mesh>

          {/* Lacquer Ring: Turmeric Gold Bead */}
          <mesh position={[0, -0.72, 0]}>
            <torusGeometry args={[0.36, 0.05, 20, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} metalness={0.05} />
          </mesh>

          {/* Main Ivory Wood Spherical Vessel */}
          <mesh position={[0, -0.38, 0]} castShadow>
            <sphereGeometry args={[0.46, 48, 48]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.16}
                metalness={0.04}
                transparent
                opacity={opacity}
              />
            ) : (
              <meshStandardMaterial
                color="#A63A24"
                roughness={0.15}
                metalness={0.04}
                transparent
                opacity={opacity}
              />
            )}
          </mesh>

          {/* Concentric Turned Tier 01 (Sindoor Vermilion) */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.46, 0.52, 0.1, 48]} />
            <meshStandardMaterial color="#962A18" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 02 (Turmeric Lacquer) */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.38, 0.44, 0.1, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 03 (Natural Ivory Wood) */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.3, 0.36, 0.1, 48]} />
            <meshStandardMaterial color="#EFE3CE" roughness={0.25} />
          </mesh>

          {/* Concentric Turned Tier 04 (Forest Indigo Lacquer) */}
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.1, 48]} />
            <meshStandardMaterial color="#2A453B" roughness={0.14} />
          </mesh>

          {/* Lathe-Spun Shikhara Conical Spire */}
          <mesh position={[0, 0.85, 0]}>
            <coneGeometry args={[0.18, 0.55, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.14} />
          </mesh>

          {/* Mirror-Gloss Kalasha Finial Sphere */}
          <mesh position={[0, 1.16, 0]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshStandardMaterial color="#962A18" roughness={0.1} />
          </mesh>
        </group>
      );

    /* ------------------------------------------------------------
       VI. KUNDAN & MEENAKARI JEWELLERY (Imperial Navratna Amulet)
       24K gold foil, polki diamonds, emerald cabochon, champlevé reverse
       ------------------------------------------------------------ */
    case 'jewellery':
      return (
        <group position={[0, 0.08, 0]}>
          {/* Royal Bail Suspension Loop with Gold Filigree */}
          <mesh position={[0, 0.82, 0]}>
            <torusGeometry args={[0.24, 0.03, 20, 36]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
          </mesh>

          {/* 22K Gold Octagonal Amulet Champlevé Matrix */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.65, 0.12, 8]} />
            <meshStandardMaterial
              color="#ECCB76"
              metalness={0.94}
              roughness={0.14}
              transparent
              opacity={opacity}
            />
          </mesh>

          {/* Center Columbian Emerald Cabochon */}
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshPhysicalMaterial
              color="#0B6B46"
              roughness={0.08}
              transmission={0.88}
              thickness={0.2}
              transparent
              opacity={0.95 * opacity}
            />
          </mesh>

          {/* Cold-Set Kundan 24K Gold Bezel Rim around Center Stone */}
          <mesh position={[0, 0, 0.075]}>
            <torusGeometry args={[0.225, 0.025, 16, 36]} />
            <meshStandardMaterial color="#F5DA88" metalness={0.96} roughness={0.12} />
          </mesh>

          {/* Eight Faceted Uncut Natural Polki Diamonds in lac beds */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i * Math.PI) / 4;
            const r = 0.44;
            return (
              <group key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.065]}>
                {/* 24K pure gold setting bezel */}
                <mesh>
                  <cylinderGeometry args={[0.08, 0.095, 0.035, 6]} />
                  <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
                </mesh>
                {/* Flat Polki diamond with crystal refraction */}
                <mesh position={[0, 0, 0.02]}>
                  <cylinderGeometry args={[0.06, 0.07, 0.015, 6]} />
                  <meshPhysicalMaterial
                    color="#FDFEFA"
                    roughness={0.04}
                    transmission={0.92}
                    thickness={0.08}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Reverse Side Confidential Meenakari Enamel Garden */}
          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.61, 8]} />
            <meshStandardMaterial
              color="#981F26"
              roughness={0.15}
              metalness={0.3}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, -0.066]} rotation={[0, Math.PI, 0]}>
            <torusGeometry args={[0.38, 0.03, 16, 32]} />
            <meshStandardMaterial color="#1B7853" roughness={0.12} metalness={0.2} />
          </mesh>

          {/* Basra Saltwater Seed Pearls Hanging on Fine Gold Wire */}
          {[-0.38, -0.19, 0, 0.19, 0.38].map((x, idx) => (
            <group key={idx} position={[x, -0.72 - Math.abs(x) * 0.22, 0]}>
              <mesh>
                <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
                <meshStandardMaterial color="#ECCB76" metalness={0.92} roughness={0.2} />
              </mesh>
              <mesh position={[0, -0.15, 0]}>
                <sphereGeometry args={[0.075, 20, 20]} />
                <meshStandardMaterial color="#FCFAF4" roughness={0.2} metalness={0.12} />
              </mesh>
            </group>
          ))}
        </group>
      );

    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#C89D42" roughness={0.3} metalness={0.5} />
        </mesh>
      );
  }
}
