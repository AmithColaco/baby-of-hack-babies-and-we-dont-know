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
  isAnySelected: _isAnySelected,
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
    const t = state.clock.getElapsedTime() + phaseOffset;

    if (modelPivotRef.current) {
      if (!isSelected) {
        // Subtle floating breathing of the craft object alone (pedestal stays anchored)
        const hoverElevate = hovered ? 0.06 : 0;
        const targetY = 0.05 + Math.sin(t * 1.0) * 0.02 + hoverElevate;
        modelPivotRef.current.position.y = MathUtils.lerp(modelPivotRef.current.position.y, targetY, 0.08);

        // Gentle idle yaw breathing
        const baseRot = object.rotation3D?.[1] || 0;
        const targetRot = baseRot + Math.sin(t * 0.45) * 0.04 + (hovered ? 0.12 : 0);
        modelPivotRef.current.rotation.y = MathUtils.lerp(modelPivotRef.current.rotation.y, targetRot, 0.06);
      } else {
        // Selected focus: elevated showcase height & smooth 360-degree turntable rotation
        modelPivotRef.current.position.y = MathUtils.lerp(modelPivotRef.current.position.y, 0.14, 0.08);
        modelPivotRef.current.rotation.y += 0.004;
      }
    }
  });

  const posX = object.position3D?.[0] ?? 0;
  const posZ = object.position3D?.[2] ?? 0;
  const rotY = object.rotation3D?.[1] ?? 0;

  return (
    <group
      ref={groupRef}
      position={[posX, 0, posZ]}
      rotation={[0, rotY, 0]}
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
      {/* 1. Museum Pedestal / Plinth (Grounded firmly on the floor at Y = -1.2) */}
      <group position={[0, -0.68, 0]}>
        {/* Soft Contact Shadow Decal directly under plinth */}
        <mesh position={[0, -0.518, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.92, 48]} />
          <meshBasicMaterial color="#3A2D22" transparent opacity={0.35} />
        </mesh>

        {/* Tiered Sandstone Plinth Base (bottom touches floor at Y = -1.20) */}
        <mesh position={[0, -0.38, 0]} receiveShadow>
          <cylinderGeometry args={[0.78, 0.86, 0.28, 48]} />
          <meshStandardMaterial
            color={isSelected || hovered ? '#F5EFE4' : '#ECE5D6'}
            roughness={0.72}
            metalness={0.04}
          />
        </mesh>

        {/* Polished Teak Plinth Top */}
        <mesh position={[0, -0.21, 0]}>
          <cylinderGeometry args={[0.73, 0.73, 0.08, 48]} />
          <meshStandardMaterial
            color="#2A1B12"
            roughness={0.45}
            metalness={0.12}
          />
        </mesh>

        {/* Beaten Brass Rim Trim */}
        <mesh position={[0, -0.165, 0]}>
          <cylinderGeometry args={[0.735, 0.735, 0.018, 48]} />
          <meshStandardMaterial
            color={isSelected ? '#F5DA88' : '#C89D42'}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Accession Plaque on Pedestal Face */}
        <mesh position={[0, -0.32, 0.81]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.34, 0.09, 0.015]} />
          <meshStandardMaterial
            color={isSelected ? '#F5DA88' : '#D4AF37'}
            metalness={0.92}
            roughness={0.18}
          />
        </mesh>

        {/* Spotlight illumination on active or hovered piece */}
        {(hovered || isSelected) && (
          <pointLight
            position={[0, 0.8, 0.2]}
            intensity={isSelected ? 2.4 : 1.6}
            distance={3.2}
            color="#FFF4D8"
          />
        )}
      </group>

      {/* 2. Sculpted Masterpiece 3D Geometry (Solid, Opaque Craft Heritage) */}
      <group
        ref={modelPivotRef}
        scale={isSelected ? [1.12, 1.12, 1.12] : hovered ? [1.04, 1.04, 1.04] : [1, 1, 1]}
      >
        {renderSculptedMasterwork(object, textureMap)}
      </group>
    </group>
  );
};

/* ============================================================
   ARCHITECTURAL & ARTISAN 3D GEOMETRY BUILDER

   High fidelity forms for each Indian Craft Tradition
   ============================================================ */

function resolveModelType(object: CraftObject): string {
  if (object.modelType) {
    const mt = object.modelType.toLowerCase();
    if (mt === 'painting' || mt === 'paintings') return 'painting';
    if (mt === 'pottery' || mt === 'ceramics' || mt === 'ceramic') return 'pottery';
    if (mt === 'textile' || mt === 'textiles') return 'textile';
    if (mt === 'brass' || mt === 'metalcraft' || mt === 'metal') return 'brass';
    if (mt === 'woodcraft' || mt === 'wood') return 'woodcraft';
    if (mt === 'jewellery' || mt === 'jewelry') return 'jewellery';
  }
  if (object.category) {
    const cat = object.category.toLowerCase();
    if (cat.includes('paint')) return 'painting';
    if (cat.includes('potter') || cat.includes('ceramic') || cat.includes('clay')) return 'pottery';
    if (cat.includes('textil') || cat.includes('silk') || cat.includes('shawl') || cat.includes('saree')) return 'textile';
    if (cat.includes('brass') || cat.includes('metal') || cat.includes('dhokra') || cat.includes('bronze')) return 'brass';
    if (cat.includes('wood') || cat.includes('toy')) return 'woodcraft';
    if (cat.includes('jewel') || cat.includes('kundan') || cat.includes('gem')) return 'jewellery';
  }
  return 'archival_easel';
}

export function renderSculptedMasterwork(
  object: CraftObject,
  texture?: Texture | null
) {
  const modelType = resolveModelType(object);

  switch (modelType) {
    /* ------------------------------------------------------------
       I. PAHARI MINIATURE PAINTING (Kangra Wasli Kalam)
       Carved teak frame, gold leaf inner fillet, burnished wasli
       ------------------------------------------------------------ */
    case 'painting':
      return (
        <group position={[0, 0.05, 0]}>
          {/* Main Carved Teak Outer Frame - Solid Opaque */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.36, 1.74, 0.08]} />
            <meshStandardMaterial
              color="#24140A"
              roughness={0.55}
              metalness={0.12}
            />
          </mesh>

          {/* Stepped Frame Bevel - Solid Opaque */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.26, 1.64, 0.04]} />
            <meshStandardMaterial
              color="#382113"
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>

          {/* 24K Beaten Gold Leaf Inner Fillet (Varq) - Solid Opaque */}
          <mesh position={[0, 0, 0.048]}>
            <boxGeometry args={[1.14, 1.52, 0.015]} />
            <meshStandardMaterial
              color="#DFBA4E"
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>

          {/* Hand-layered Wasli Paper Painting Face - Solid Opaque */}
          <mesh position={[0, 0, 0.058]}>
            <planeGeometry args={[1.06, 1.44]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.35}
                metalness={0.08}
              />
            ) : (
              <meshStandardMaterial
                color="#F0E8D5"
                roughness={0.45}
              />
            )}
          </mesh>

          {/* Glazing Glass Reflection Plane - Legitimately Transparent */}
          <mesh position={[0, 0, 0.062]}>
            <planeGeometry args={[1.06, 1.44]} />
            <meshPhysicalMaterial
              color="#FFFFFF"
              roughness={0.05}
              transmission={0.92}
              thickness={0.04}
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>

          {/* Reverse Side Teak Backing & Archival Seal - Solid Opaque */}
          <mesh position={[0, 0, -0.042]}>
            <planeGeometry args={[1.34, 1.72]} />
            <meshStandardMaterial
              color="#1E1108"
              roughness={0.8}
              side={DoubleSide}
            />
          </mesh>

          {/* Brass Suspension Rings on Top - Solid Opaque */}
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
          {/* Fluted Ceramic Foot Base - Solid Opaque */}
          <mesh position={[0, -0.7, 0]} castShadow>
            <cylinderGeometry args={[0.34, 0.44, 0.14, 48]} />
            <meshStandardMaterial
              color="#0A3C6B"
              roughness={0.12}
              metalness={0.15}
            />
          </mesh>

          {/* Gilded Foot Ring - Solid Opaque */}
          <mesh position={[0, -0.62, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.025, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Swelling Baluster Urn Body - Solid Opaque Glazed Quartz */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <sphereGeometry args={[0.66, 48, 48]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.1}
                metalness={0.12}
              />
            ) : (
              <meshStandardMaterial
                color="#0D47A1"
                roughness={0.12}
                metalness={0.15}
              />
            )}
          </mesh>

          {/* Tapered Neck with Persian Arabesque Glaze - Solid Opaque */}
          <mesh position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.26, 0.42, 0.52, 48]} />
            <meshStandardMaterial
              color="#1E88E5"
              roughness={0.08}
              metalness={0.1}
            />
          </mesh>

          {/* Molded Flanged Lip - Solid Opaque */}
          <mesh position={[0, 0.7, 0]}>
            <torusGeometry args={[0.28, 0.045, 24, 48]} />
            <meshStandardMaterial color="#0A3C6B" roughness={0.1} />
          </mesh>

          {/* Domed Finial Lid - Solid Opaque */}
          <mesh position={[0, 0.82, 0]}>
            <coneGeometry args={[0.28, 0.28, 48]} />
            <meshStandardMaterial color="#0A3C6B" roughness={0.12} />
          </mesh>

          {/* 24K Gold Finial Stupa Peak - Solid Opaque */}
          <mesh position={[0, 0.98, 0]}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#E8C045" metalness={0.9} roughness={0.18} />
          </mesh>

          {/* Twin Acanthus Loop Handles - Solid Opaque */}
          {[-1, 1].map((sign) => (
            <group key={sign} position={[sign * 0.6, 0.02, 0]} rotation={[0, 0, (sign * Math.PI) / 4]}>
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
          {/* Handcrafted Rosewood Suspension Dowel - Solid Opaque */}
          <mesh position={[0, 0.86, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 1.52, 32]} />
            <meshStandardMaterial color="#2B1408" roughness={0.45} />
          </mesh>

          {/* Turned Brass Rod Finials - Solid Opaque */}
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

          {/* Draped Gossamer Mulberry Silk Body - Solid Opaque Silk Texture */}
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
              />
            ) : (
              <meshStandardMaterial
                color="#6B1420"
                roughness={0.35}
                metalness={0.25}
                side={DoubleSide}
              />
            )}
          </mesh>

          {/* Real Silver Electroplated Gold Zari Border (Pallu) - Solid Opaque */}
          <mesh position={[0, -0.84, 0.06]}>
            <boxGeometry args={[1.28, 0.16, 0.04]} />
            <meshStandardMaterial
              color="#DFBD76"
              metalness={0.88}
              roughness={0.2}
            />
          </mesh>

          {/* Hanging Gold Silk Tassels along Lower Hem - Solid Opaque */}
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
          {/* Tubular Cast Bell-Metal Torso - Solid Opaque Bronze */}
          <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.28, 0.68, 20, 32]} />
            <meshStandardMaterial
              color="#9C752B"
              metalness={0.86}
              roughness={0.34}
            />
          </mesh>

          {/* Extruded Wax Wire Filigree Rings along Body - Solid Opaque */}
          {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.285, 0.018, 12, 32]} />
              <meshStandardMaterial color="#BCA058" metalness={0.88} roughness={0.3} />
            </mesh>
          ))}

          {/* Elongated Bastar Neck - Solid Opaque */}
          <mesh position={[0.44, 0.48, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <cylinderGeometry args={[0.12, 0.2, 0.65, 24]} />
            <meshStandardMaterial color="#946F28" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Crested Archival Mane - Solid Opaque */}
          <mesh position={[0.42, 0.62, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <boxGeometry args={[0.03, 0.48, 0.18]} />
            <meshStandardMaterial color="#B08D38" metalness={0.88} roughness={0.3} />
          </mesh>

          {/* Muzzle & Sculpted Head - Solid Opaque */}
          <mesh position={[0.66, 0.74, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <coneGeometry args={[0.15, 0.32, 20]} />
            <meshStandardMaterial color="#946F28" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Tribal Ears - Solid Opaque */}
          {[-0.08, 0.08].map((z) => (
            <mesh key={z} position={[0.62, 0.9, z]} rotation={[0, 0, Math.PI / 6]}>
              <coneGeometry args={[0.04, 0.15, 12]} />
              <meshStandardMaterial color="#BCA058" metalness={0.88} roughness={0.3} />
            </mesh>
          ))}

          {/* Ceremonial Saddle with Medallion - Solid Opaque */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.38, 0.08, 0.36]} />
            <meshStandardMaterial color="#C59B3C" metalness={0.9} roughness={0.28} />
          </mesh>

          {/* Slender Ritual Legs with Flared Hooves - Solid Opaque */}
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

          {/* Braided Bronze Tail - Solid Opaque */}
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
          {/* Rosewood Foundation Base - Solid Opaque */}
          <mesh position={[0, -0.84, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.44, 0.14, 48]} />
            <meshStandardMaterial color="#28150B" roughness={0.35} />
          </mesh>

          {/* Lacquer Ring: Turmeric Gold Bead - Solid Opaque */}
          <mesh position={[0, -0.72, 0]}>
            <torusGeometry args={[0.36, 0.05, 20, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} metalness={0.05} />
          </mesh>

          {/* Main Ivory Wood Spherical Vessel - Solid Opaque */}
          <mesh position={[0, -0.38, 0]} castShadow>
            <sphereGeometry args={[0.46, 48, 48]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.16}
                metalness={0.04}
              />
            ) : (
              <meshStandardMaterial
                color="#A63A24"
                roughness={0.15}
                metalness={0.04}
              />
            )}
          </mesh>

          {/* Concentric Turned Tier 01 (Sindoor Vermilion) - Solid Opaque */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.46, 0.52, 0.1, 48]} />
            <meshStandardMaterial color="#962A18" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 02 (Turmeric Lacquer) - Solid Opaque */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.38, 0.44, 0.1, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 03 (Natural Ivory Wood) - Solid Opaque */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.3, 0.36, 0.1, 48]} />
            <meshStandardMaterial color="#EFE3CE" roughness={0.25} />
          </mesh>

          {/* Concentric Turned Tier 04 (Forest Indigo Lacquer) - Solid Opaque */}
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.1, 48]} />
            <meshStandardMaterial color="#2A453B" roughness={0.14} />
          </mesh>

          {/* Lathe-Spun Shikhara Conical Spire - Solid Opaque */}
          <mesh position={[0, 0.85, 0]}>
            <coneGeometry args={[0.18, 0.55, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.14} />
          </mesh>

          {/* Mirror-Gloss Kalasha Finial Sphere - Solid Opaque */}
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
          {/* Royal Bail Suspension Loop with Gold Filigree - Solid Opaque */}
          <mesh position={[0, 0.82, 0]}>
            <torusGeometry args={[0.24, 0.03, 20, 36]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
          </mesh>

          {/* 22K Gold Octagonal Amulet Matrix - Solid Opaque */}
          <mesh position={[0, 0, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.65, 0.12, 8]} />
            <meshStandardMaterial
              color="#ECCB76"
              metalness={0.94}
              roughness={0.14}
            />
          </mesh>

          {/* Center Emerald Cabochon - Legitimately Transparent Physical Gemstone */}
          <mesh position={[0, 0, 0.07]}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshPhysicalMaterial
              color="#0B6B46"
              roughness={0.08}
              transmission={0.88}
              thickness={0.2}
              transparent
              depthWrite={false}
            />
          </mesh>

          {/* Cold-Set Kundan 24K Gold Bezel Rim around Center Stone - Solid Opaque */}
          <mesh position={[0, 0, 0.075]}>
            <torusGeometry args={[0.225, 0.025, 16, 36]} />
            <meshStandardMaterial color="#F5DA88" metalness={0.96} roughness={0.12} />
          </mesh>

          {/* Eight Faceted Uncut Natural Polki Diamonds in lac beds - Legitimately Translucent Diamond Crystals */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i * Math.PI) / 4;
            const r = 0.44;
            return (
              <group key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.065]}>
                {/* 24K pure gold setting bezel - Solid Opaque */}
                <mesh>
                  <cylinderGeometry args={[0.08, 0.095, 0.035, 6]} />
                  <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
                </mesh>
                {/* Flat Polki diamond with crystal refraction - Transparent with depthWrite false */}
                <mesh position={[0, 0, 0.02]}>
                  <cylinderGeometry args={[0.06, 0.07, 0.015, 6]} />
                  <meshPhysicalMaterial
                    color="#FDFEFA"
                    roughness={0.04}
                    transmission={0.92}
                    thickness={0.08}
                    transparent
                    depthWrite={false}
                  />
                </mesh>
              </group>
            );
          })}

          {/* Reverse Side Confidential Meenakari Enamel Garden - Solid Opaque */}
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

          {/* Basra Saltwater Seed Pearls - Solid Opaque */}
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

    /* ------------------------------------------------------------
       VII. ARCHIVAL EXHIBITION EASEL & DISPLAY PLAQUE
       Curatorial fallback for custom/seller craft products without
       dedicated sculpted geometry. Renders a museum-grade carved
       rosewood easel, gold fillet bezel, textured archival mount,
       and glass cover.
       ------------------------------------------------------------ */
    case 'archival_easel':
    default:
      return (
        <group position={[0, 0.1, 0]}>
          {/* Rosewood Easel Uprights - Solid Opaque */}
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, -0.05, -0.12]} rotation={[0.16, 0, 0]} castShadow>
              <boxGeometry args={[0.045, 1.82, 0.045]} />
              <meshStandardMaterial color="#2B150A" roughness={0.4} metalness={0.08} />
            </mesh>
          ))}

          {/* Easel Crossbar Rest - Solid Opaque */}
          <mesh position={[0, -0.52, -0.04]} castShadow>
            <boxGeometry args={[1.22, 0.07, 0.14]} />
            <meshStandardMaterial color="#381D0F" roughness={0.35} metalness={0.1} />
          </mesh>

          {/* Retaining Lip on Crossbar (Brass) - Solid Opaque */}
          <mesh position={[0, -0.48, 0.035]}>
            <boxGeometry args={[1.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Exhibition Plaque Mount (Tilted back by 0.14 rad on easel) */}
          <group position={[0, 0.08, 0]} rotation={[-0.14, 0, 0]}>
            {/* Dark Rosewood Framing Slab - Solid Opaque */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.28, 1.48, 0.06]} />
              <meshStandardMaterial
                color="#221208"
                roughness={0.45}
                metalness={0.1}
              />
            </mesh>

            {/* 24K Gold Leaf Inlay Margin - Solid Opaque */}
            <mesh position={[0, 0, 0.032]}>
              <boxGeometry args={[1.18, 1.38, 0.01]} />
              <meshStandardMaterial
                color="#DFBD76"
                roughness={0.22}
                metalness={0.88}
              />
            </mesh>

            {/* Museum Conservation Mounting Board (Raw Silk / Wasli) - Solid Opaque */}
            <mesh position={[0, 0, 0.038]}>
              <planeGeometry args={[1.12, 1.32]} />
              {texture ? (
                <meshStandardMaterial
                  map={texture}
                  roughness={0.3}
                  metalness={0.06}
                />
              ) : (
                <meshStandardMaterial
                  color="#EDE2CE"
                  roughness={0.5}
                />
              )}
            </mesh>

            {/* Preservation Vitrine Glass - Legitimately Transparent */}
            <mesh position={[0, 0, 0.044]}>
              <planeGeometry args={[1.12, 1.32]} />
              <meshPhysicalMaterial
                color="#FFFFFF"
                roughness={0.04}
                transmission={0.94}
                thickness={0.03}
                transparent
                opacity={0.3}
                depthWrite={false}
              />
            </mesh>

            {/* Brass Archival Seal / Emblem at Top Center - Solid Opaque */}
            <mesh position={[0, 0.68, 0.035]}>
              <cylinderGeometry args={[0.045, 0.045, 0.015, 24]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        </group>
      );
  }
}

