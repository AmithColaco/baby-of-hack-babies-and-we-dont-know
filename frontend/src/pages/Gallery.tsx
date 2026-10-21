import { useState, useEffect, useCallback } from 'react';
import { GalleryCanvas } from '../gallery/GalleryCanvas';
import { HeroIntro } from '../components/HeroIntro';
import { GalleryNav } from '../components/GalleryNav';
import { ObjectDetailPanel } from '../components/ObjectDetailPanel';
import { CartDrawer } from '../components/CartDrawer';
import { StoriesModal } from '../components/StoriesModal';
import { MakingOfModal } from '../components/MakingOfModal';
import { AboutModal } from '../components/AboutModal';
import { TwoDArchiveView } from '../components/TwoDArchiveView';
import { CRAFT_OBJECTS } from '../data/craftsData';
import type { CraftObject, CraftCategory } from '../types';

export default function Gallery() {
  const [hasEntered, setHasEntered] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedObject, setSelectedObject] = useState<CraftObject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CraftCategory>('all');
  const [activeSection, setActiveSection] = useState<'collection' | 'stories' | 'making' | 'about'>('collection');
  const [activeStoryArticleId, setActiveStoryArticleId] = useState<string | undefined>();

  // Filtered objects
  const filteredObjects =
    selectedCategory === 'all'
      ? CRAFT_OBJECTS
      : CRAFT_OBJECTS.filter((o) => o.category === selectedCategory);

  // Next and Previous navigation across objects
  const handleNextObject = useCallback(() => {
    if (!selectedObject) {
      setSelectedObject(filteredObjects[0]);
      return;
    }
    const idx = filteredObjects.findIndex((o) => o.id === selectedObject.id);
    const nextIdx = (idx + 1) % filteredObjects.length;
    setSelectedObject(filteredObjects[nextIdx]);
  }, [filteredObjects, selectedObject]);

  const handlePrevObject = useCallback(() => {
    if (!selectedObject) {
      setSelectedObject(filteredObjects[filteredObjects.length - 1]);
      return;
    }
    const idx = filteredObjects.findIndex((o) => o.id === selectedObject.id);
    const prevIdx = (idx - 1 + filteredObjects.length) % filteredObjects.length;
    setSelectedObject(filteredObjects[prevIdx]);
  }, [filteredObjects, selectedObject]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedObject) setSelectedObject(null);
        if (activeSection !== 'collection') setActiveSection('collection');
      } else if (e.key === 'ArrowRight' && selectedObject) {
        handleNextObject();
      } else if (e.key === 'ArrowLeft' && selectedObject) {
        handlePrevObject();
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key) && hasEntered) {
        const index = parseInt(e.key, 10) - 1;
        if (CRAFT_OBJECTS[index]) {
          setSelectedObject(CRAFT_OBJECTS[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObject, activeSection, hasEntered, handleNextObject, handlePrevObject]);

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
        onResetCamera={() => setSelectedObject(null)}
        hasIntroDismissed={hasEntered}
        onReturnToIntro={() => {
          setSelectedObject(null);
          setHasEntered(false);
        }}
      />

      {/* 3. Main Exhibition Area: 3D Spatial Canvas OR 2D Curatorial Catalog */}
      <div className="gallery-viewport">
        {viewMode === '3d' ? (
          <GalleryCanvas
            selectedObject={selectedObject}
            onSelectObject={(obj: CraftObject | null) => setSelectedObject(obj)}
            filteredCategory={selectedCategory}
          />
        ) : (
          <TwoDArchiveView
            selectedCategory={selectedCategory}
            onSelectObject={(obj: CraftObject) => setSelectedObject(obj)}
            onEnter3D={() => setViewMode('3d')}
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
