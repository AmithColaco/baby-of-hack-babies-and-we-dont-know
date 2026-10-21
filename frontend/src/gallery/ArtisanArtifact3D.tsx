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
        const hoverElevate = hovered ? 0.08 : 0;
        const targetY = 0.05 + Math.sin(t * 1.1) * 0.025 + hoverElevate;
        modelPivotRef.current.position.y = MathUtils.lerp(modelPivotRef.current.position.y, targetY, 0.08);

        // Gentle idle yaw breathing
        const baseRot = object.rotation3D?.[1] || 0;
        const targetRot = baseRot + Math.sin(t * 0.45) * 0.05 + (hovered ? 0.15 : 0);
        modelPivotRef.current.rotation.y = MathUtils.lerp(modelPivotRef.current.rotation.y, targetRot, 0.06);
      } else {
        // Selected focus: elevated showcase height & smooth 360-degree turntable rotation
        modelPivotRef.current.position.y = MathUtils.lerp(modelPivotRef.current.position.y, 0.16, 0.08);
        modelPivotRef.current.rotation.y += 0.005;
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
        <mesh position={[0, -0.38, 0]}>
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
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>

        {/* Accession Plaque on Pedestal Face */}
        <mesh position={[0, -0.32, 0.81]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.34, 0.09, 0.015]} />
          <meshStandardMaterial
            color={isSelected ? '#F5DA88' : '#D4AF37'}
            metalness={0.92}
            roughness={0.2}
          />
        </mesh>

        {/* Spotlight illumination on active or hovered piece */}
        {(hovered || isSelected) && (
          <pointLight
            position={[0, 0.8, 0.2]}
            intensity={isSelected ? 2.5 : 1.6}
            distance={3.2}
            color="#FFF4D8"
          />
        )}
      </group>

      {/* 2. Sculpted Masterpiece 3D Geometry (True 3D Volumetric Heritage) */}
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

   High-fidelity, authentic volumetric 3D models for each craft.
   Paintings are museum-framed with physical depth.
   Pottery, textiles, metalcraft, woodcraft, and jewelry are
   fully realized 3D sculptural objects.
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
       Authentic painting displayed in a handcrafted 3D carved teak frame,
       with stepped bevels, gold leaf inner fillet, and protective glazing.
       ------------------------------------------------------------ */
    case 'painting':
      return (
        <group position={[0, 0.05, 0]}>
          {/* Main Carved Teak Outer Frame */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.36, 1.74, 0.08]} />
            <meshStandardMaterial
              color="#24140A"
              roughness={0.55}
              metalness={0.12}
            />
          </mesh>

          {/* Stepped Frame Bevel */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.26, 1.64, 0.04]} />
            <meshStandardMaterial
              color="#382113"
              roughness={0.5}
              metalness={0.1}
            />
          </mesh>

          {/* 24K Beaten Gold Leaf Inner Fillet (Varq) */}
          <mesh position={[0, 0, 0.048]}>
            <boxGeometry args={[1.14, 1.52, 0.015]} />
            <meshStandardMaterial
              color="#DFBA4E"
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>

          {/* Hand-layered Wasli Paper Painting Face */}
          <mesh position={[0, 0, 0.058]}>
            <planeGeometry args={[1.06, 1.44]} />
            {texture ? (
              <meshStandardMaterial
                map={texture}
                roughness={0.35}
                metalness={0.06}
              />
            ) : (
              <meshStandardMaterial
                color="#F0E8D5"
                roughness={0.45}
              />
            )}
          </mesh>

          {/* Glazing Glass Reflection Plane */}
          <mesh position={[0, 0, 0.062]}>
            <planeGeometry args={[1.06, 1.44]} />
            <meshPhysicalMaterial
              color="#FFFFFF"
              roughness={0.05}
              transmission={0.92}
              thickness={0.04}
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>

          {/* Reverse Side Teak Backing */}
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
            <mesh key={x} position={[x, 0.88, 0]}>
              <torusGeometry args={[0.04, 0.01, 16, 24]} />
              <meshStandardMaterial color="#C89D42" metalness={0.85} roughness={0.25} />
            </mesh>
          ))}
        </group>
      );

    /* ------------------------------------------------------------
       II. JAIPUR BLUE POTTERY (Glazed Quartz Urn / Baluster Vase)
       Full 3D sculptural ceramic vessel with fluted foot, bulbous
       contour body, arabesque waist band, fluted neck, flared rim,
       sculpted handles, and a golden stupa finial lid.
       ------------------------------------------------------------ */
    case 'pottery':
      return (
        <group position={[0, 0.02, 0]}>
          {/* Tiered Ceramic Foot Base */}
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[0.34, 0.44, 0.12, 48]} />
            <meshStandardMaterial
              color="#0A3C6B"
              roughness={0.18}
              metalness={0.12}
            />
          </mesh>

          {/* Gilded Brass Foot Ring Trim */}
          <mesh position={[0, -0.61, 0]}>
            <cylinderGeometry args={[0.355, 0.355, 0.024, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Lower Baluster Urn Belly (Deep Cobalt Quartz Ceramic) */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.54, 0.35, 0.54, 48]} />
            <meshStandardMaterial
              color="#0D47A1"
              roughness={0.15}
              metalness={0.12}
            />
          </mesh>

          {/* Mid Swelling Urn Torus */}
          <mesh position={[0, -0.06, 0]}>
            <torusGeometry args={[0.48, 0.12, 24, 48]} />
            <meshStandardMaterial
              color="#0A3C6B"
              roughness={0.15}
              metalness={0.12}
            />
          </mesh>

          {/* Main Body (Cobalt & Turquoise Arabesque Faience) */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.44, 0.56, 0.48, 48]} />
            <meshStandardMaterial
              color="#1565C0"
              roughness={0.16}
              metalness={0.1}
            />
          </mesh>

          {/* Inlaid Gilded Persian Arabesque Filigree Ring around Waist */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.445, 0.445, 0.05, 48]} />
            <meshStandardMaterial
              color="#D4AF37"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>

          {/* Tapered Shoulder Collar (Turquoise glaze) */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.26, 0.44, 0.22, 48]} />
            <meshStandardMaterial
              color="#00838F"
              roughness={0.14}
              metalness={0.1}
            />
          </mesh>

          {/* Tall Fluted Neck (Cream Porcelain with Cobalt Stripes) */}
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.32, 48]} />
            <meshStandardMaterial
              color="#FAF8F5"
              roughness={0.18}
              metalness={0.06}
            />
          </mesh>

          {/* Flared Molded Lip Rim with Gold Leaf Trim */}
          <mesh position={[0, 0.78, 0]}>
            <torusGeometry args={[0.26, 0.04, 20, 48]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Domed Ceramic Lid */}
          <mesh position={[0, 0.86, 0]}>
            <coneGeometry args={[0.25, 0.22, 48]} />
            <meshStandardMaterial color="#0A3C6B" roughness={0.15} metalness={0.1} />
          </mesh>

          {/* 24K Gold Stupa / Kalasha Finial Peak */}
          <mesh position={[0, 1.02, 0]}>
            <sphereGeometry args={[0.065, 24, 24]} />
            <meshStandardMaterial color="#E8C045" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Twin Sculpted Acanthus Loop Handles */}
          {[-1, 1].map((sign) => (
            <group key={sign} position={[sign * 0.52, 0.22, 0]} rotation={[0, 0, (sign * Math.PI) / 3.8]}>
              <mesh>
                <torusGeometry args={[0.24, 0.042, 20, 36, Math.PI * 1.15]} />
                <meshStandardMaterial color="#0A3C6B" roughness={0.15} metalness={0.1} />
              </mesh>
              <mesh position={[0, 0.12, 0]}>
                <sphereGeometry args={[0.045, 16, 16]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      );

    /* ------------------------------------------------------------
       III. CHANDERI HANDWOVEN ROYAL SILK (Royal Peacock Zari Saree)
       Displayed on a haute-couture sartorial dress form / mannequin.
       Features an authentic Indian Nivi drape: structured vertical front
       pleats (patli), form-fitting hip wrap, diagonal cross-bodice drape,
       wide 24K electroplated gold zari border, and a dramatic, sweeping
       peacock brocade pallu cascading over the shoulder with embossed
       golden peacock medallions and swinging latkan tassels.
       ------------------------------------------------------------ */
    case 'textile':
      return (
        <group position={[0, -0.05, 0]}>
          {/* 1. Museum Sartorial Display Stand (Polished Brass & Teak Tripod) */}
          {/* Floor Mount Disc Base */}
          <mesh position={[0, -0.58, 0]}>
            <cylinderGeometry args={[0.34, 0.38, 0.04, 36]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Stepped Teak Collar on Stand */}
          <mesh position={[0, -0.54, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.05, 32]} />
            <meshStandardMaterial color="#2B150A" roughness={0.4} />
          </mesh>

          {/* Vertical Brass Support Stem */}
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.44, 20]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* 2. Haute Couture Tailored Mannequin Torso (Dark Velvet Dress Form) */}
          {/* Mannequin Neck Finial in Polished Brass */}
          <mesh position={[0, 0.94, 0]}>
            <sphereGeometry args={[0.055, 20, 20]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.065, 0.075, 0.1, 24]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Mannequin Upper Torso / Shoulders (Tailored Black Velvet) */}
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.22, 0.27, 0.26, 32]} />
            <meshStandardMaterial color="#1B1A19" roughness={0.88} />
          </mesh>
          {/* Left & Right Shoulder Caps */}
          {[-0.24, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.74, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#1B1A19" roughness={0.88} />
            </mesh>
          ))}

          {/* Inner Madder Red Silk Blouse / Choli with Gold Zari Piping */}
          <mesh position={[0, 0.66, 0.02]}>
            <cylinderGeometry args={[0.225, 0.26, 0.22, 32]} />
            <meshStandardMaterial color="#5C1019" roughness={0.32} metalness={0.2} />
          </mesh>
          {/* Blouse Golden Neckline Piping */}
          <mesh position={[0, 0.77, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.015, 12, 32, Math.PI]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* 3. The Chanderi Silk Saree Skirt (Petticoat Wrap with Volumetric Flare) */}
          {/* Flared Saree Skirt Body */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.25, 0.44, 0.68, 40]} />
            <meshStandardMaterial
              color="#821A28"
              roughness={0.3}
              metalness={0.22}
            />
          </mesh>

          {/* Saree Base Zari Pallu Hem (Heavy Pure Silver-Electroplated 24K Gold Zari Border) */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.435, 0.45, 0.12, 40]} />
            <meshStandardMaterial
              color="#DFBD76"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
          {/* Secondary Upper Zari Piping on Skirt Hem */}
          <mesh position={[0, -0.21, 0]}>
            <cylinderGeometry args={[0.425, 0.43, 0.02, 40]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.16} />
          </mesh>

          {/* 4. Front Knife Pleats (Patli) — Iconic Waterfall Fan of Saree Pleats */}
          {[-0.08, -0.04, 0, 0.04, 0.08].map((x, i) => (
            <group key={i} position={[x, -0.06, 0.28 + (4 - i) * 0.015]} rotation={[0, 0, (x * 0.2)]}>
              {/* Individual Pleat Blade */}
              <mesh>
                <boxGeometry args={[0.048, 0.54, 0.024]} />
                <meshStandardMaterial color={i % 2 === 0 ? '#8E1D2D' : '#7A1825'} roughness={0.28} metalness={0.25} />
              </mesh>
              {/* Gold Zari Piping along each Pleat Ridge */}
              <mesh position={[0, 0, 0.014]}>
                <boxGeometry args={[0.008, 0.53, 0.008]} />
                <meshStandardMaterial color="#ECCB76" metalness={0.92} roughness={0.2} />
              </mesh>
              {/* Gold Border at base of each pleat */}
              <mesh position={[0, -0.23, 0.006]}>
                <boxGeometry args={[0.05, 0.08, 0.026]} />
                <meshStandardMaterial color="#DFBD76" metalness={0.92} roughness={0.18} />
              </mesh>
            </group>
          ))}

          {/* Waist Tuck Knot (Navel Gather / Kamarbandh) */}
          <mesh position={[0, 0.36, 0.25]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.11, 0.07, 0.05]} />
            <meshStandardMaterial color="#DFBD76" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* 5. Diagonal Cross-Bodice Drape (Nivi Swag across Chest) */}
          <group position={[0.04, 0.54, 0.12]} rotation={[0.08, -0.15, -0.42]}>
            <mesh>
              <boxGeometry args={[0.22, 0.44, 0.04]} />
              <meshStandardMaterial color="#881C2B" roughness={0.3} metalness={0.22} />
            </mesh>
            {/* Diagonal Gold Zari Selvedge running from waist to left shoulder */}
            <mesh position={[-0.105, 0, 0.018]}>
              <boxGeometry args={[0.035, 0.45, 0.02]} />
              <meshStandardMaterial color="#DFBD76" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>

          {/* 6. The Royal Peacock Pallu (Dramatic Sweeping Brocade Cascade) */}
          {/* Shoulder Wrap Over Left Shoulder */}
          <mesh position={[-0.22, 0.77, 0.02]} rotation={[0.2, 0.1, 0.25]}>
            <boxGeometry args={[0.16, 0.22, 0.06]} />
            <meshStandardMaterial color="#7A1825" roughness={0.28} metalness={0.22} />
          </mesh>
          <mesh position={[-0.22, 0.78, 0.05]} rotation={[0.2, 0.1, 0.25]}>
            <boxGeometry args={[0.04, 0.23, 0.02]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.16} />
          </mesh>

          {/* Sweeping Waterfall Cascade of the Pallu Down the Side/Back */}
          {/* Upper Cascade Swag */}
          <mesh position={[-0.28, 0.48, -0.06]} rotation={[-0.1, 0.2, 0.1]}>
            <cylinderGeometry args={[0.22, 0.28, 0.48, 24, 1, true, -Math.PI * 0.4, Math.PI * 0.8]} />
            <meshStandardMaterial color="#821A28" roughness={0.3} metalness={0.2} side={DoubleSide} />
          </mesh>

          {/* Lower Sweeping Billow of the Pallu Swiveling Forward */}
          <mesh position={[-0.32, 0.08, 0.1]} rotation={[0.15, -0.3, -0.12]}>
            <cylinderGeometry args={[0.26, 0.36, 0.52, 24, 1, true, -Math.PI * 0.45, Math.PI * 0.85]} />
            <meshStandardMaterial color="#8E1D2D" roughness={0.28} metalness={0.22} side={DoubleSide} />
          </mesh>

          {/* Grand Gold Zari Brocade Panel on the Pallu Tail */}
          <group position={[-0.34, -0.08, 0.22]} rotation={[0.1, -0.35, -0.08]}>
            {/* Woven Real Gold Zari Extra-Weft Panel */}
            <mesh>
              <boxGeometry args={[0.34, 0.28, 0.035]} />
              <meshStandardMaterial color="#DFBD76" metalness={0.92} roughness={0.18} />
            </mesh>

            {/* Embossed Royal Peacock Medallions (Dancing Peacocks of Chanderi) */}
            {[-0.08, 0.08].map((px) => (
              <group key={px} position={[px, 0.02, 0.022]}>
                {/* Peacock Medallion Ring */}
                <mesh>
                  <torusGeometry args={[0.042, 0.007, 12, 24]} />
                  <meshStandardMaterial color="#F5DA88" metalness={0.96} roughness={0.12} />
                </mesh>
                {/* Peacock Body & Crown */}
                <mesh position={[0, -0.005, 0]}>
                  <sphereGeometry args={[0.02, 12, 12]} />
                  <meshStandardMaterial color="#2E7D32" metalness={0.4} roughness={0.3} />
                </mesh>
                {/* Peacock Fan Tail Feather Sprays */}
                <mesh position={[0, 0.02, 0]}>
                  <coneGeometry args={[0.03, 0.04, 12]} />
                  <meshStandardMaterial color="#00838F" metalness={0.4} roughness={0.3} />
                </mesh>
              </group>
            ))}

            {/* Pallu Lower Fringe Band */}
            <mesh position={[0, -0.13, 0.008]}>
              <boxGeometry args={[0.35, 0.04, 0.04]} />
              <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.15} />
            </mesh>

            {/* Hand-Tied Hanging Latkan Tassels with Seed Pearls */}
            {[-0.12, -0.06, 0, 0.06, 0.12].map((tx) => (
              <group key={tx} position={[tx, -0.21, 0.01]}>
                <mesh>
                  <cylinderGeometry args={[0.004, 0.004, 0.12, 8]} />
                  <meshStandardMaterial color="#C89D42" metalness={0.88} />
                </mesh>
                {/* Pearl Bead */}
                <mesh position={[0, -0.07, 0]}>
                  <sphereGeometry args={[0.018, 12, 12]} />
                  <meshStandardMaterial color="#FAF7ED" roughness={0.2} metalness={0.1} />
                </mesh>
                {/* Gold Bell Cap */}
                <mesh position={[0, -0.09, 0]}>
                  <coneGeometry args={[0.016, 0.025, 12]} />
                  <meshStandardMaterial color="#ECCB76" metalness={0.94} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      );

    /* ------------------------------------------------------------
       IV. BASTAR DHOKRA LOST-WAX BRONZE (Ceremonial Guardian Horse)
       True 3D Harappan cire-perdue cast bell-metal steed with
       coiled wax-wire ribs, arched long neck, serrated mane,
       flared hooves, ceremonial saddle, and antique patina.
       ------------------------------------------------------------ */
    case 'brass':
      return (
        <group position={[0, -0.06, 0]}>
          {/* Volumetric Hollow Cast Bell-Metal Torso */}
          <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.26, 0.66, 20, 32]} />
            <meshStandardMaterial
              color="#9A7328"
              metalness={0.88}
              roughness={0.32}
            />
          </mesh>

          {/* Coiled Wax-Wire Filigree Rib Rings along Body */}
          {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.268, 0.018, 12, 32]} />
              <meshStandardMaterial color="#BCA058" metalness={0.9} roughness={0.28} />
            </mesh>
          ))}

          {/* Arched Tribal Bastar Neck */}
          <mesh position={[0.42, 0.46, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <cylinderGeometry args={[0.11, 0.19, 0.62, 24]} />
            <meshStandardMaterial color="#946F28" metalness={0.86} roughness={0.34} />
          </mesh>

          {/* Raised Serrated Crest Mane */}
          <mesh position={[0.39, 0.6, 0]} rotation={[0, 0, -Math.PI / 5.5]}>
            <boxGeometry args={[0.035, 0.46, 0.16]} />
            <meshStandardMaterial color="#B8943C" metalness={0.9} roughness={0.28} />
          </mesh>

          {/* Conical Muzzle & Sculpted Head */}
          <mesh position={[0.64, 0.72, 0]} rotation={[0, 0, -Math.PI / 8]}>
            <coneGeometry args={[0.14, 0.3, 20]} />
            <meshStandardMaterial color="#946F28" metalness={0.86} roughness={0.34} />
          </mesh>

          {/* Alert Tribal Ears */}
          {[-0.08, 0.08].map((z) => (
            <mesh key={z} position={[0.6, 0.88, z]} rotation={[0, 0, Math.PI / 6]}>
              <coneGeometry args={[0.038, 0.14, 12]} />
              <meshStandardMaterial color="#BCA058" metalness={0.9} roughness={0.28} />
            </mesh>
          ))}

          {/* Ceremonial Saddle with Diamond Filigree */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.36, 0.08, 0.34]} />
            <meshStandardMaterial color="#C59B3C" metalness={0.92} roughness={0.26} />
          </mesh>

          {/* Four Sturdy Ritual Legs with Flared Hooves & Bells */}
          {[-0.32, 0.32].map((x) =>
            [-0.14, 0.14].map((z) => (
              <group key={`${x}-${z}`} position={[x, -0.4, z]}>
                <mesh>
                  <cylinderGeometry args={[0.046, 0.062, 0.76, 16]} />
                  <meshStandardMaterial color="#886420" metalness={0.88} roughness={0.34} />
                </mesh>
                <mesh position={[0, -0.36, 0]}>
                  <cylinderGeometry args={[0.075, 0.085, 0.06, 16]} />
                  <meshStandardMaterial color="#B58E38" metalness={0.92} roughness={0.26} />
                </mesh>
              </group>
            ))
          )}

          {/* Braided Arched Bronze Tail */}
          <mesh position={[-0.46, 0.08, 0]} rotation={[0, 0, Math.PI / 3]}>
            <cylinderGeometry args={[0.024, 0.048, 0.46, 12]} />
            <meshStandardMaterial color="#886420" metalness={0.88} roughness={0.34} />
          </mesh>
        </group>
      );

    /* ------------------------------------------------------------
       V. CHANNAPATNA LACQUER WOOD (Temple Shikhara Totem)
       True 3D lathe-turned sculpture combining polished natural
       ivory wood with high-gloss vegetable lacquered tiers.
       ------------------------------------------------------------ */
    case 'woodcraft':
      return (
        <group position={[0, 0.08, 0]}>
          {/* Polished Indian Rosewood Base */}
          <mesh position={[0, -0.82, 0]}>
            <cylinderGeometry args={[0.38, 0.44, 0.14, 48]} />
            <meshStandardMaterial color="#28150B" roughness={0.35} />
          </mesh>

          {/* Lacquer Ring: Turmeric Gold Bead */}
          <mesh position={[0, -0.7, 0]}>
            <torusGeometry args={[0.36, 0.05, 20, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} metalness={0.06} />
          </mesh>

          {/* Ivory Wood Spherical Vessel Body */}
          <mesh position={[0, -0.36, 0]}>
            <sphereGeometry args={[0.46, 48, 48]} />
            <meshStandardMaterial
              color="#A63A24"
              roughness={0.16}
              metalness={0.04}
            />
          </mesh>

          {/* Concentric Turned Tier 01: Sindoor Vermilion */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.46, 0.52, 0.1, 48]} />
            <meshStandardMaterial color="#962A18" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 02: Turmeric Lacquer */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.38, 0.44, 0.1, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.12} />
          </mesh>

          {/* Concentric Turned Tier 03: Natural Ivory Wood (Aale Mara) */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.3, 0.36, 0.1, 48]} />
            <meshStandardMaterial color="#EFE3CE" roughness={0.28} />
          </mesh>

          {/* Concentric Turned Tier 04: Forest Indigo Lacquer */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.1, 48]} />
            <meshStandardMaterial color="#2A453B" roughness={0.14} />
          </mesh>

          {/* Lathe-Spun Shikhara Conical Spire */}
          <mesh position={[0, 0.88, 0]}>
            <coneGeometry args={[0.18, 0.56, 48]} />
            <meshStandardMaterial color="#D49B24" roughness={0.14} />
          </mesh>

          {/* Mirror-Gloss Kalasha Finial Sphere */}
          <mesh position={[0, 1.18, 0]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshStandardMaterial color="#962A18" roughness={0.1} />
          </mesh>
        </group>
      );

    /* ------------------------------------------------------------
       VI. KUNDAN & MEENAKARI JEWELLERY (Imperial Royal Amulet)
       True 3D museum display with arched velvet neck, 24K gold
       champlevé amulet, sparkling emerald center, polki diamonds,
       and cascading Basra seed pearls.
       ------------------------------------------------------------ */
    case 'jewellery':
      return (
        <group position={[0, 0.08, 0]}>
          {/* Black Velvet Archival Jewelry Display Stand */}
          <mesh position={[0, -0.42, -0.08]}>
            <cylinderGeometry args={[0.22, 0.32, 0.82, 32]} />
            <meshStandardMaterial color="#1C1B1A" roughness={0.88} />
          </mesh>

          {/* Brass Suspension Arm */}
          <mesh position={[0, 0.82, 0]}>
            <torusGeometry args={[0.24, 0.03, 20, 36]} />
            <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
          </mesh>

          {/* 22K Gold Octagonal Amulet Matrix */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.62, 0.65, 0.12, 8]} />
            <meshStandardMaterial
              color="#ECCB76"
              metalness={0.94}
              roughness={0.14}
            />
          </mesh>

          {/* Center Emerald Cabochon Gemstone */}
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

          {/* 24K Gold Kundan Bezel Rim around Center Emerald */}
          <mesh position={[0, 0, 0.075]}>
            <torusGeometry args={[0.225, 0.025, 16, 36]} />
            <meshStandardMaterial color="#F5DA88" metalness={0.96} roughness={0.12} />
          </mesh>

          {/* Eight Faceted Natural Polki Diamonds in Gold Bezels */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i * Math.PI) / 4;
            const r = 0.44;
            return (
              <group key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, 0.065]}>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.095, 0.035, 6]} />
                  <meshStandardMaterial color="#ECCB76" metalness={0.94} roughness={0.14} />
                </mesh>
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

          {/* Reverse Side Royal Meenakari Enamel Garden */}
          <mesh position={[0, 0, -0.065]} rotation={[0, Math.PI, 0]}>
            <circleGeometry args={[0.61, 8]} />
            <meshStandardMaterial
              color="#981F26"
              roughness={0.15}
              metalness={0.3}
              side={DoubleSide}
            />
          </mesh>

          {/* Basra Saltwater Seed Pearls dangling from rim */}
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
       VII. ARCHIVAL EXHIBITION SHOWCASE (Fallback / Custom Products)
       Museum pedestal showcase with rosewood base and brass mounts
       ------------------------------------------------------------ */
    case 'archival_easel':
    default:
      return (
        <group position={[0, 0.1, 0]}>
          {/* Rosewood Easel Uprights */}
          {[-0.42, 0.42].map((x) => (
            <mesh key={x} position={[x, -0.05, -0.12]} rotation={[0.16, 0, 0]}>
              <boxGeometry args={[0.045, 1.82, 0.045]} />
              <meshStandardMaterial color="#2B150A" roughness={0.4} metalness={0.08} />
            </mesh>
          ))}

          {/* Easel Crossbar Rest */}
          <mesh position={[0, -0.52, -0.04]}>
            <boxGeometry args={[1.22, 0.07, 0.14]} />
            <meshStandardMaterial color="#381D0F" roughness={0.35} metalness={0.1} />
          </mesh>

          {/* Retaining Lip on Crossbar (Brass) */}
          <mesh position={[0, -0.48, 0.035]}>
            <boxGeometry args={[1.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.88} roughness={0.2} />
          </mesh>

          {/* Exhibition Plaque Mount */}
          <group position={[0, 0.08, 0]} rotation={[-0.14, 0, 0]}>
            {/* Dark Rosewood Framing Slab */}
            <mesh>
              <boxGeometry args={[1.28, 1.48, 0.06]} />
              <meshStandardMaterial
                color="#221208"
                roughness={0.45}
                metalness={0.1}
              />
            </mesh>

            {/* 24K Gold Leaf Inlay Margin */}
            <mesh position={[0, 0, 0.032]}>
              <boxGeometry args={[1.18, 1.38, 0.01]} />
              <meshStandardMaterial
                color="#DFBD76"
                roughness={0.22}
                metalness={0.88}
              />
            </mesh>

            {/* Museum Conservation Mounting Board */}
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

            {/* Preservation Vitrine Glass */}
            <mesh position={[0, 0, 0.044]}>
              <planeGeometry args={[1.12, 1.32]} />
              <meshPhysicalMaterial
                color="#FFFFFF"
                roughness={0.04}
                transmission={0.94}
                thickness={0.03}
                transparent
                opacity={0.25}
                depthWrite={false}
              />
            </mesh>

            {/* Brass Archival Seal / Emblem at Top Center */}
            <mesh position={[0, 0.68, 0.035]}>
              <cylinderGeometry args={[0.045, 0.045, 0.015, 24]} />
              <meshStandardMaterial color="#D4AF37" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        </group>
      );
  }
}
