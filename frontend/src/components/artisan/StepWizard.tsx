import React from 'react';
import { useTranslation } from 'react-i18next';

interface StepWizardProps {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onSaveDraft?: () => void;
  children: React.ReactNode;
}

export function StepWizard({ step, totalSteps, onBack, onSaveDraft, children }: StepWizardProps) {
  const { t } = useTranslation();
  const pct = Math.round((step / totalSteps) * 100);
  return (
    <div className="a-wizard">
      <div className="a-wizard__topbar">
        <button
          type="button"
          className="a-wizard__back-btn"
          onClick={onBack}
          aria-label={t('common.back', 'Back')}
        >
          ←
        </button>
        <div className="a-wizard__step-info">
          <div className="a-wizard__step-label">
            {t('artisan.step_of', 'Step {{step}} of {{total}}', { step, total: totalSteps })}
          </div>
          <div
            className="a-wizard__progress-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% complete`}
          >
            <div className="a-wizard__progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {onSaveDraft && (
          <button type="button" className="a-wizard__draft-btn" onClick={onSaveDraft}>
            {t('artisan.save_draft', 'Save draft')}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
