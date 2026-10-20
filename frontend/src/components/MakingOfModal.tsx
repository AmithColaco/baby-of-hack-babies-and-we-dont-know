import { MAKING_STEPS } from '../data/craftsData';

interface MakingOfModalProps {
  onClose: () => void;
  onSelectObjectByName?: (craft: string) => void;
}

export const MakingOfModal = ({ onClose }: MakingOfModalProps) => {
  return (
    <div className="curatorial-overlay" role="dialog" aria-modal="true">
      <div className="curatorial-modal-card">
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">THE CRAFT ARCHIVE</span>
            <h2 className="modal-title">The Making Of: Raw Earth to Artifact</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close making of">
            ✕
          </button>
        </div>

        <div className="making-of-content">
          <p className="making-of-intro">
            Every tradition featured in Kaarigar rejects mechanized shortcuts. Here is how ancient alchemy, earth minerals, and decades of hand memory converge into six enduring craft lineages.
          </p>

          <div className="making-grid">
            {MAKING_STEPS.map((step, idx) => (
              <article key={step.id} className="making-card">
                <div className="making-card__image-wrap">
                  <img src={step.image} alt={step.title} className="making-card__img" />
                  <span className="making-card__duration">⏱ {step.duration}</span>
                </div>
                <div className="making-card__body">
                  <span className="making-card__step-num">STAGE 0{idx + 1}</span>
                  <div className="making-card__craft">{step.craft}</div>
                  <h4 className="making-card__title">{step.title}</h4>
                  <p className="making-card__desc">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
