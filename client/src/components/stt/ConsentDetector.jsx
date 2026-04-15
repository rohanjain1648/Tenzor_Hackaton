import React, { useMemo } from 'react';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CONSENT_KEYWORDS = [
  'i agree', 'i consent', 'yes i do', 'i accept', 'confirm', 'proceed', 'authorized'
];

export default function ConsentDetector() {
  const { transcripts } = useTranscriptStore();

  const consentStatus = useMemo(() => {
    const allText = transcripts.map(t => t.text.toLowerCase()).join(' ');
    const detected = CONSENT_KEYWORDS.some(keyword => allText.includes(keyword));
    return detected;
  }, [transcripts]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0.75rem',
      background: consentStatus ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${consentStatus ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {consentStatus ? (
          <CheckCircle size={18} color="var(--color-success)" />
        ) : (
          <AlertCircle size={18} color="var(--color-warning)" />
        )}
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
          Verbal Consent: {consentStatus ? 'CAPTURED' : 'AWAITING'}
        </span>
      </div>
      {consentStatus && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>
          Verified via Speech
        </span>
      )}
    </div>
  );
}
