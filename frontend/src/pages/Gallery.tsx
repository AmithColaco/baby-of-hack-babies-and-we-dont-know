import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GalleryCanvas } from '../gallery/GalleryCanvas';
import { HeroIntro } from '../components/HeroIntro';
import { GalleryNav } from '../components/GalleryNav';
import { ObjectDetailPanel } from '../components/ObjectDetailPanel';
import { CartDrawer } from '../components/CartDrawer';
import { StoriesModal } from '../components/StoriesModal';
import { MakingOfModal } from '../components/MakingOfModal';
import { AboutModal } from '../components/AboutModal';
import { TwoDArchiveView } from '../components/TwoDArchiveView';
import { useProducts } from '../data/productStore';
import type { CraftObject, CraftCategory } from '../types';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProducts();

  const [hasEntered, setHasEntered] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedObject, setSelectedObject] = useState<CraftObject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CraftCategory>('all');
  const [activeSection, setActiveSection] = useState<'collection' | 'stories' | 'making' | 'about'>('collection');
  const [activeStoryArticleId, setActiveStoryArticleId] = useState<string | undefined>();

  // Filtered objects
  const filteredObjects =
    selectedCategory === 'all'
      ? products
      : products.filter((o) => o.category === selectedCategory);

  // Sync selected craft object with ?focus=<id> or ?id=<id> in URL query
  useEffect(() => {
    const focusId = searchParams.get('focus') || searchParams.get('id');
    if (focusId && products.length > 0) {
      const match = products.find((p) => p.id === focusId);
      if (match && selectedObject?.id !== match.id) {
        setSelectedObject(match);
        if (selectedCategory !== 'all' && match.category !== selectedCategory) {
          setSelectedCategory('all');
        }
      }
    }
  }, [searchParams, products, selectedCategory, selectedObject?.id]);

  const handleSelectObject = useCallback((obj: CraftObject | null) => {
    setSelectedObject(obj);
    if (obj) {
      setSearchParams({ focus: obj.id }, { replace: true });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('focus');
      newParams.delete('id');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Next and Previous navigation across objects
  const handleNextObject = useCallback(() => {
    if (filteredObjects.length === 0) return;
    if (!selectedObject) {
      handleSelectObject(filteredObjects[0]);
      return;
    }
    const idx = filteredObjects.findIndex((o) => o.id === selectedObject.id);
    const nextIdx = (idx + 1) % filteredObjects.length;
    handleSelectObject(filteredObjects[nextIdx]);
  }, [filteredObjects, selectedObject, handleSelectObject]);

  const handlePrevObject = useCallback(() => {
    if (filteredObjects.length === 0) return;
    if (!selectedObject) {
      handleSelectObject(filteredObjects[filteredObjects.length - 1]);
      return;
    }
    const idx = filteredObjects.findIndex((o) => o.id === selectedObject.id);
    const prevIdx = (idx - 1 + filteredObjects.length) % filteredObjects.length;
    handleSelectObject(filteredObjects[prevIdx]);
  }, [filteredObjects, selectedObject, handleSelectObject]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedObject) handleSelectObject(null);
        if (activeSection !== 'collection') setActiveSection('collection');
      } else if (e.key === 'ArrowRight' && selectedObject) {
        handleNextObject();
      } else if (e.key === 'ArrowLeft' && selectedObject) {
        handlePrevObject();
      } else if (hasEntered && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1;
        if (products[index]) {
          handleSelectObject(products[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, activeSection, hasEntered, handleNextObject, handlePrevObject, handleSelectObject, products]);

  const handleOpenArtisanStory = (artisanCraftId: string) => {
    if (artisanCraftId === 'pahari-miniature') {
      setActiveStoryArticleId('living-pigments-kangra');
    } else if (artisanCraftId === 'bastar-dhokra-brass') {
      setActiveStoryArticleId('fire-and-wax-bastar');
    } else if (artisanCraftId === 'chanderi-handwoven-silk') {
      setActiveStoryArticleId('gossamer-threads-chanderi');
    }
    setActiveSection('stories');
  };

  return (
    <main className="kaarigar-app-container">
      {/* 1. Restrained Introductory Gate */}
      {!hasEntered && (
        <HeroIntro
          onEnterGallery={() => setHasEntered(true)}
          onEnter2DArchive={() => {
            setViewMode('2d');
            setHasEntered(true);
          }}
        />
      )}

      {/* 2. Minimal Gallery Navigation Header */}
      <GalleryNav
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
        activeSection={activeSection}
        onSelectSection={(sec: 'collection' | 'stories' | 'making' | 'about') => {
          setActiveSection(sec);
          if (sec === 'collection' && !hasEntered) setHasEntered(true);
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat: CraftCategory) => setSelectedCategory(cat)}
        onResetCamera={() => handleSelectObject(null)}
        hasIntroDismissed={hasEntered}
        onReturnToIntro={() => {
          handleSelectObject(null);
          setHasEntered(false);
        }}
        totalCount={products.length}
      />

      {/* 3. Main Exhibition Area: 3D Spatial Canvas OR 2D Curatorial Catalog */}
      <div className="gallery-viewport">
        {viewMode === '3d' ? (
          <GalleryCanvas
            selectedObject={selectedObject}
            onSelectObject={handleSelectObject}
            filteredCategory={selectedCategory}
            products={products}
          />
        ) : (
          <TwoDArchiveView
            selectedCategory={selectedCategory}
            onSelectObject={(obj: CraftObject) => handleSelectObject(obj)}
            onEnter3D={() => setViewMode('3d')}
            products={products}
          />
        )}

        {/* 3D Spatial Controls Hint on bottom left */}
        {viewMode === '3d' && !selectedObject && hasEntered && (
          <div className="spatial-hint" aria-hidden="true">
            <span className="hint-bullet">✦</span>
            <span>Drag to rotate scene · Scroll to zoom · Click an artifact or press 1–6</span>
          </div>
        )}
      </div>

      {/* 4. Editorial Object Detail Panel (Accession Dossier) */}
      {selectedObject && (
        <ObjectDetailPanel
          object={selectedObject}
          onClose={() => setSelectedObject(null)}
          onSelectNext={handleNextObject}
          onSelectPrev={handlePrevObject}
          onOpenStory={handleOpenArtisanStory}
        />
      )}

      {/* 5. Curatorial Bag / Cart Drawer */}
      <CartDrawer />

      {/* 6. Curatorial Section Modals */}
      {activeSection === 'stories' && (
        <StoriesModal
          onClose={() => setActiveSection('collection')}
          selectedArticleId={activeStoryArticleId}
        />
      )}

      {activeSection === 'making' && (
        <MakingOfModal
          onClose={() => setActiveSection('collection')}
        />
      )}

      {activeSection === 'about' && (
        <AboutModal
          onClose={() => setActiveSection('collection')}
        />
      )}
    </main>
  );
}
