import { Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, ClampToEdgeWrapping } from 'three';
import type { Texture } from 'three';
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

  // Preload authentic craft textures
  useEffect(() => {
    const loader = new TextureLoader();
    const map: Record<string, Texture> = {};

    CRAFT_OBJECTS.forEach((obj) => {
      loader.load(
        obj.image,
        (tex: Texture) => {
          tex.colorSpace = SRGBColorSpace;
          tex.wrapS = ClampToEdgeWrapping;
          tex.wrapT = ClampToEdgeWrapping;
          map[obj.id] = tex;
          setTextures((prev) => ({ ...prev, [obj.id]: tex }));
        },
        undefined,
        () => {
          // Fallback if image load fails
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
        background: '#FAF7F2',
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
          // React Three Fiber event target is internal canvas element
          if (e.target === e.currentTarget && selectedObject) {
            onSelectObject(null);
          }
        }}
      >
        <Suspense fallback={null}>
          <GalleryEnvironment />
          <GalleryCameraRig selectedObject={selectedObject} />

          {/* Render All 6 Artisan Objects */}
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
    </div>
  );
};
