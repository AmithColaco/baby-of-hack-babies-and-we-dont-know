import { useState } from 'react';
import { EDITORIAL_STORIES } from '../data/craftsData';
import { handleImageError, getFallbackForCraft } from '../utils/imageFallback';
import type { StoryArticle } from '../types';

interface StoriesModalProps {
  onClose: () => void;
  selectedArticleId?: string;
  onSelectObjectById?: (id: string) => void;
}

export const StoriesModal = ({
  onClose,
  selectedArticleId,
}: StoriesModalProps) => {
  const [activeStory, setActiveStory] = useState<StoryArticle>(() => {
    if (selectedArticleId) {
      const found = EDITORIAL_STORIES.find((s) => s.id === selectedArticleId);
      if (found) return found;
    }
    return EDITORIAL_STORIES[0];
  });

  return (
    <div className="curatorial-overlay" role="dialog" aria-modal="true">
      <div className="curatorial-modal-card">
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">CURATORIAL MONOGRAPHS</span>
            <h2 className="modal-title">Stories from the Guilds</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close stories">
            ✕
          </button>
        </div>

        <div className="stories-container">
          {/* Left story selector list */}
          <aside className="stories-sidebar">
            {EDITORIAL_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => setActiveStory(story)}
                className={`story-tab-card ${activeStory.id === story.id ? 'story-tab--active' : ''}`}
              >
                <span className="story-tab__craft">{story.craftTradition}</span>
                <h4 className="story-tab__title">{story.title}</h4>
                <div className="story-tab__meta">
                  <span>{story.artisan}</span> · <span>{story.readTime}</span>
                </div>
              </button>
            ))}
          </aside>

          {/* Right active story reader */}
          <article className="story-reader">
            <div className="story-reader__hero">
              <img
                src={activeStory.coverImage}
                alt={activeStory.title}
                className="story-reader__img"
                onError={(e) => handleImageError(e, getFallbackForCraft(activeStory.craftTradition))}
              />
              <div className="story-reader__caption">
                Master Artisan in Atelier · {activeStory.region}
              </div>
            </div>

            <div className="story-reader__body">
              <span className="story-tradition-tag">{activeStory.craftTradition}</span>
              <h3 className="story-headline">{activeStory.title}</h3>
              <p className="story-subheadline">{activeStory.subtitle}</p>

              <div className="story-meta-bar">
                <span>By Archival Custodian</span> · <span>{activeStory.artisan}</span> · <span>{activeStory.region}</span>
              </div>

              <blockquote className="story-callout-quote">
                “{activeStory.quote}”
              </blockquote>

              <div className="story-paragraphs">
                {activeStory.paragraphs.map((para, i) => (
                  <p key={i} className="story-paragraph">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
