import { useState, useRef, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceInputFieldProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  rows?: number;
}

export const VoiceInputField = forwardRef<HTMLTextAreaElement, VoiceInputFieldProps>(
  ({ value, onChange, placeholder, label, id = 'voice-field', rows = 3 }, ref) => {
    const [recording, setRecording] = useState(false);
    const { t, i18n } = useTranslation();
    const recognitionRef = useRef<any>(null);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const supported = Boolean(SpeechRecognition);

    const toggleRecording = () => {
      if (!SpeechRecognition) return;
      if (recording) {
        recognitionRef.current?.stop();
        setRecording(false);
        return;
      }
      const r = new SpeechRecognition();
      const langMap: Record<string, string> = { kn: 'kn-IN', hi: 'hi-IN', en: 'en-IN' };
      r.lang = langMap[i18n.language] || 'en-IN';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onstart = () => setRecording(true);
      r.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        onChange(value ? `${value} ${transcript}` : transcript);
      };
      r.onerror = () => setRecording(false);
      r.onend = () => setRecording(false);
      recognitionRef.current = r;
      r.start();
    };

    return (
      <div className="a-voice-field">
        {label && <label className="a-form-label" htmlFor={id}>{label}</label>}
        <textarea
          ref={ref}
          id={id}
          className="a-voice-field__input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-label={label}
        />
        {supported && (
          <button
            type="button"
            className={`a-voice-field__mic-btn${recording ? ' a-voice-field__mic-btn--recording' : ''}`}
            onClick={toggleRecording}
            aria-label={recording ? t('artisan.stop_recording', 'Stop recording') : t('artisan.start_recording', 'Speak your description')}
            aria-pressed={recording}
            title={recording ? t('artisan.stop_recording', 'Stop') : t('artisan.start_recording', 'Speak')}
          >
            {recording ? '⏹' : '🎙'}
          </button>
        )}
        {!supported && (
          <p className="a-voice-unsupported" aria-live="polite">
            {t('artisan.voice_unsupported', 'Voice not available in this browser - please type')}
          </p>
        )}
      </div>
    );
  }
);
VoiceInputField.displayName = 'VoiceInputField';
