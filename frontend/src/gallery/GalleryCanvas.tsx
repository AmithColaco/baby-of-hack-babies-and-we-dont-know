import { Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, ClampToEdgeWrapping } from 'three';
import type { Texture } from 'three';
import { Link } from 'react-router-dom';
import { GalleryEnvironment } from './GalleryEnvironment';
import { GalleryCameraRig } from './GalleryCameraRig';
import { ArtisanArtifact3D } from './ArtisanArtifact3D';
import { CRAFT_OBJECTS } from '../data/craftsData';
import type { CraftObject } from '../types';

interface GalleryCanvasProps {
  selectedObject: CraftObject | null;
  onSelectObject: (object: CraftObject | null) => void;
  filteredCategory?: string;
}

export const GalleryCanvas = ({
  selectedObject,
  onSelectObject,
  filteredCategory = 'all',
}: GalleryCanvasProps) => {
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
      }
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Preload authentic craft textures in batch
  useEffect(() => {
    const loader = new TextureLoader();
    const map: Record<string, Texture> = {};
    let loadedCount = 0;

    CRAFT_OBJECTS.forEach((obj) => {
      loader.load(
        obj.image,
        (tex: Texture) => {
          tex.colorSpace = SRGBColorSpace;
          tex.wrapS = ClampToEdgeWrapping;
          tex.wrapT = ClampToEdgeWrapping;
          map[obj.id] = tex;
          loadedCount++;
          if (loadedCount === CRAFT_OBJECTS.length || loadedCount % 2 === 0) {
            setTextures((prev) => ({ ...prev, ...map }));
          }
        },
        undefined,
        () => {
          // Fallback if image fails
        }
      );
    });
  }, []);

  const visibleObjects = useMemo(() => {
    if (filteredCategory === 'all') return CRAFT_OBJECTS;
    return CRAFT_OBJECTS.filter((o) => o.category === filteredCategory);
  }, [filteredCategory]);

  if (!webGLSupported) {
    return (
      <div className="webgl-fallback-notice">
        <p>WebGL is unavailable on this device. Switching to the 2D Curatorial Archive.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        backgroundColor: '#F9F5EE',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && selectedObject) {
          onSelectObject(null);
        }
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.2, 8.5], fov: 42, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget && selectedObject) {
            onSelectObject(null);
          }
        }}
      >
        <Suspense fallback={null}>
          <GalleryEnvironment />
          <GalleryCameraRig selectedObject={selectedObject} />

          {/* Render All Sculpted Artisan Objects */}
          <group position={[0, 0, 0]}>
            {visibleObjects.map((obj) => (
              <ArtisanArtifact3D
                key={obj.id}
                object={obj}
                isSelected={selectedObject?.id === obj.id}
                isAnySelected={selectedObject !== null}
                onSelect={(selected) => {
                  onSelectObject(selected);
                }}
                textureMap={textures[obj.id]}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>

      {/* Floating 3D HUD & Curatorial Selection Overlay */}
      {selectedObject && (
        <div
          className="gallery-selection-hud"
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(253, 251, 247, 0.94)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(184, 92, 56, 0.25)',
            borderRadius: '12px',
            padding: '1rem 1.75rem',
            boxShadow: '0 16px 40px rgba(28, 28, 26, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.75rem',
            zIndex: 60,
            maxWidth: '90%',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#B85C38', letterSpacing: '0.12em' }}>
                {selectedObject.accessionNo} · {selectedObject.romanNumeral}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#7A7570', textTransform: 'uppercase' }}>
                {selectedObject.craftTradition}
              </span>
            </div>
            <h4 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', color: '#1C1C1A', margin: '0.15rem 0' }}>
              {selectedObject.title}
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#4A4740' }}>
              By {selectedObject.artisan} · ₹{selectedObject.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <Link
              to={`/shop/${selectedObject.id}`}
              className="dash-btn dash-btn--primary"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.78rem' }}
            >
              Discover Sacred Story →
            </Link>
            <button
              type="button"
              className="dash-btn dash-btn--secondary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.78rem' }}
              onClick={() => onSelectObject(null)}
            >
              Reset View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
