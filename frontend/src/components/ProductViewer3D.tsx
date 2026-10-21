import { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { TextureLoader, SRGBColorSpace, ClampToEdgeWrapping } from 'three';
import type { Texture } from 'three';
import type { CraftObject } from '../types';
import { renderSculptedMasterwork } from '../gallery/ArtisanArtifact3D';

interface ProductViewer3DProps {
  product: CraftObject;
}

export const ProductViewer3D = ({ product }: ProductViewer3DProps) => {
  // Available media items: 3 authentic photographs + 1 interactive 3D model
  const mediaItems = [
    { id: 'img-0', type: 'image', src: product.image, label: 'Primary Masterwork', tag: 'HERO' },
    { id: 'img-1', type: 'image', src: '/images/artisan.jpg', label: 'Master Artisan & Atelier', tag: 'ATELIER' },
    { id: 'img-2', type: 'image', src: '/images/pahari.jpg', label: 'Material & Pigment Provenance', tag: 'DETAIL' },
    { id: '3d-view', type: '3d', src: '', label: 'Interactive 3D Masterwork', tag: '3D / 360°' },
  ];

  const [activeMediaId, setActiveMediaId] = useState<string>('img-0');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [productTexture, setProductTexture] = useState<Texture | null>(null);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const fullscreenControlsRef = useRef<OrbitControlsImpl>(null);

  // Preload product texture for 3D model
  useEffect(() => {
    if (!product.image) return;
    const loader = new TextureLoader();
    loader.load(
      product.image,
      (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.wrapS = ClampToEdgeWrapping;
        tex.wrapT = ClampToEdgeWrapping;
        setProductTexture(tex);
      },
      undefined,
      () => {
        // Texture fallback handled gracefully inside renderSculptedMasterwork
      }
    );
  }, [product.image]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleZoom = (delta: number) => {
    const ctrl = isFullscreen ? fullscreenControlsRef.current : controlsRef.current;
    if (!ctrl) return;
    const cam = ctrl.object;
    if (!cam) return;
    // Move along camera direction
    cam.position.multiplyScalar(delta > 0 ? 0.85 : 1.18);
    ctrl.update();
  };

  const handleResetCamera = () => {
    const ctrl = isFullscreen ? fullscreenControlsRef.current : controlsRef.current;
    if (!ctrl) return;
    ctrl.reset();
    setIsAutoRotating(true);
  };

  const is3D = activeMediaId === '3d-view';
  const currentMedia = mediaItems.find((m) => m.id === activeMediaId) || mediaItems[0];

  return (
    <div className="product-viewer" aria-label={`Media viewer for ${product.title}`}>
      {/* 1. Left Thumbnail Selection Rail */}
      <div className="viewer-thumbnails" role="tablist" aria-label="Product media selector">
        {mediaItems.map((item) => {
          const isSelected = activeMediaId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={item.label}
              className={`viewer-thumb-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setActiveMediaId(item.id)}
            >
              {item.type === 'image' ? (
                <div className="thumb-preview">
                  <img src={item.src} alt={item.label} className="thumb-img" loading="lazy" />
                  <span className="thumb-pill">{item.tag}</span>
                </div>
              ) : (
                <div className="thumb-preview thumb-preview--3d">
                  <div className="thumb-3d-glyph">✦</div>
                  <span className="thumb-3d-label">3D VIEW</span>
                  <span className="thumb-3d-badge">360°</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Large Central Viewport */}
      <div className="viewer-stage">
        {is3D ? (
          /* ========================================================
             INTERACTIVE 3D PRODUCT INSPECTION VIEW
             ======================================================== */
          <div className="viewer-3d-canvas-wrap">
            <Canvas
              shadows
              dpr={[1, 1.75]}
              camera={{ position: [0, 0.2, 3.4], fov: 42, near: 0.1, far: 20 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
              style={{ width: '100%', height: '100%', background: '#F8F4EC' }}
            >
              <Suspense fallback={null}>
                {/* Refined Museum Studio Lighting */}
                <ambientLight intensity={1.1} color="#FFF8EB" />
                <directionalLight
                  position={[3, 5, 4]}
                  intensity={2.2}
                  color="#FFF3DC"
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                />
                <directionalLight position={[-4, 2, -2]} intensity={0.9} color="#D6E4FF" />
                <pointLight position={[0, -1, 1.5]} intensity={0.8} color="#FFD9B3" />

                {/* Grounding Sandstone Pedestal with Contact Shadow */}
                <group position={[0, -0.65, 0]}>
                  {/* Soft Shadow Decal */}
                  <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[1.1, 48]} />
                    <meshBasicMaterial color="#3A2D22" transparent opacity={0.25} />
                  </mesh>
                  {/* Sandstone Base Disc */}
                  <mesh position={[0, -0.06, 0]} receiveShadow>
                    <cylinderGeometry args={[0.95, 1.02, 0.1, 48]} />
                    <meshStandardMaterial color="#ECE4D6" roughness={0.75} />
                  </mesh>
                  {/* Rosewood Beveled Trim */}
                  <mesh position={[0, -0.012, 0]}>
                    <cylinderGeometry args={[0.92, 0.92, 0.02, 48]} />
                    <meshStandardMaterial color="#2B1408" roughness={0.4} />
                  </mesh>
                </group>

                {/* Solid, Authentic 3D Craft Model */}
                <group position={[0, -0.38, 0]}>
                  {renderSculptedMasterwork(product, productTexture)}
                </group>

                {/* Intuitive Orbit Controls */}
                <OrbitControls
                  ref={controlsRef}
                  target={[0, 0.08, 0]}
                  autoRotate={isAutoRotating}
                  autoRotateSpeed={1.8}
                  enableDamping
                  dampingFactor={0.06}
                  minDistance={1.2}
                  maxDistance={5.5}
                  minPolarAngle={Math.PI / 8}
                  maxPolarAngle={Math.PI / 2 + 0.05}
                />
              </Suspense>
            </Canvas>

            {/* Familiar Amazon-inspired 3D Controls Toolbar */}
            <div className="viewer-3d-toolbar" role="toolbar" aria-label="3D model camera controls">
              <button
                type="button"
                className={`viewer-control-btn ${isAutoRotating ? 'active' : ''}`}
                onClick={() => setIsAutoRotating((prev) => !prev)}
                title={isAutoRotating ? 'Pause 360° rotation' : 'Start 360° rotation'}
                aria-label="Toggle 360 rotation"
              >
                <span>{isAutoRotating ? '⏸ 360°' : '▶ 360°'}</span>
              </button>

              <button
                type="button"
                className="viewer-control-btn"
                onClick={() => handleZoom(1)}
                title="Zoom in on model"
                aria-label="Zoom in"
              >
                <span>+</span>
              </button>

              <button
                type="button"
                className="viewer-control-btn"
                onClick={() => handleZoom(-1)}
                title="Zoom out"
                aria-label="Zoom out"
              >
                <span>−</span>
              </button>

              <button
                type="button"
                className="viewer-control-btn"
                onClick={handleResetCamera}
                title="Reset view"
                aria-label="Reset view"
              >
                <span>↺</span>
              </button>

              <button
                type="button"
                className="viewer-control-btn"
                onClick={() => setIsFullscreen(true)}
                title="Expand full screen"
                aria-label="Expand full screen"
              >
                <span>⛶</span>
              </button>
            </div>

            {/* Interactive Drag & Zoom Guidance Hint */}
            <div className="viewer-3d-hint">
              <span>✦ Drag to rotate 360° · Scroll or pinch to zoom</span>
            </div>
          </div>
        ) : (
          /* ========================================================
             HIGH-RESOLUTION PHOTOGRAPHY VIEW
             ======================================================== */
          <div className="viewer-image-wrap">
            <img
              src={currentMedia.src}
              alt={currentMedia.label}
              className="viewer-hero-img"
              loading="eager"
            />
            <div className="viewer-image-badges">
              <span className="badge-accession">{product.accessionNo}</span>
              <span className="badge-tradition">{product.craftTradition}</span>
            </div>

            <button
              type="button"
              className="viewer-expand-img-btn"
              onClick={() => setIsFullscreen(true)}
              title="View full image"
              aria-label="Expand image"
            >
              <span>⛶ Expand</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Fullscreen Inspection Modal */}
      {isFullscreen && (
        <div
          className="viewer-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded view of ${product.title}`}
        >
          <div className="viewer-modal-header">
            <div className="viewer-modal-title">
              <span className="modal-accession">{product.accessionNo}</span>
              <h3>{product.title}</h3>
              <span className="modal-tradition">{product.craftTradition}</span>
            </div>

            <div className="viewer-modal-actions">
              {/* Media Switcher inside modal */}
              <div className="modal-tabs">
                {mediaItems.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`modal-tab ${activeMediaId === m.id ? 'active' : ''}`}
                    onClick={() => setActiveMediaId(m.id)}
                  >
                    {m.type === '3d' ? '✦ 3D Model' : m.tag}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="viewer-modal-close"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close full screen view"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="viewer-modal-body">
            {is3D ? (
              <div className="modal-canvas-wrap">
                <Canvas
                  shadows
                  dpr={[1, 2]}
                  camera={{ position: [0, 0.2, 3.4], fov: 40, near: 0.1, far: 20 }}
                  gl={{ antialias: true, powerPreference: 'high-performance' }}
                  style={{ width: '100%', height: '100%', background: '#1C1C1A' }}
                >
                  <Suspense fallback={null}>
                    <ambientLight intensity={1.3} color="#FFF8EB" />
                    <directionalLight position={[4, 6, 4]} intensity={2.6} color="#FFF3DC" castShadow />
                    <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#D6E4FF" />
                    <pointLight position={[0, -1, 2]} intensity={1.0} color="#FFD9B3" />

                    <group position={[0, -0.65, 0]}>
                      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[1.2, 48]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
                      </mesh>
                      <mesh position={[0, -0.06, 0]} receiveShadow>
                        <cylinderGeometry args={[0.95, 1.02, 0.1, 48]} />
                        <meshStandardMaterial color="#2B2824" roughness={0.6} />
                      </mesh>
                    </group>

                    <group position={[0, -0.38, 0]}>
                      {renderSculptedMasterwork(product, productTexture)}
                    </group>

                    <OrbitControls
                      ref={fullscreenControlsRef}
                      target={[0, 0.08, 0]}
                      autoRotate={isAutoRotating}
                      autoRotateSpeed={1.8}
                      enableDamping
                      dampingFactor={0.06}
                      minDistance={1.0}
                      maxDistance={6.0}
                    />
                  </Suspense>
                </Canvas>

                <div className="viewer-3d-toolbar" role="toolbar" aria-label="3D modal controls">
                  <button
                    type="button"
                    className={`viewer-control-btn ${isAutoRotating ? 'active' : ''}`}
                    onClick={() => setIsAutoRotating((prev) => !prev)}
                    aria-label="Toggle 360 rotation"
                  >
                    <span>{isAutoRotating ? '⏸ 360°' : '▶ 360°'}</span>
                  </button>
                  <button
                    type="button"
                    className="viewer-control-btn"
                    onClick={() => handleZoom(1)}
                    aria-label="Zoom in"
                  >
                    <span>+</span>
                  </button>
                  <button
                    type="button"
                    className="viewer-control-btn"
                    onClick={() => handleZoom(-1)}
                    aria-label="Zoom out"
                  >
                    <span>−</span>
                  </button>
                  <button
                    type="button"
                    className="viewer-control-btn"
                    onClick={handleResetCamera}
                    aria-label="Reset view"
                  >
                    <span>↺</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-img-wrap">
                <img src={currentMedia.src} alt={currentMedia.label} className="modal-large-img" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
