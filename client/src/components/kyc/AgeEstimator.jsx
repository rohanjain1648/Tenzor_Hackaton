import React from 'react';
import { useKYCStore } from '../../stores/kycStore';
import { User, ShieldAlert } from 'lucide-react';

export default function AgeEstimator() {
  const { estimatedAge } = useKYCStore();

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      padding: '1rem', 
      borderRadius: 'var(--radius-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={20} color="var(--color-accent-2)" />
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>AI Age Estimation</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {estimatedAge ? `${estimatedAge} years` : 'Analyzing...'}
          </div>
        </div>
      </div>
      
      {estimatedAge && estimatedAge < 18 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-danger)' }}>
          <ShieldAlert size={16} />
          <span style={{ fontSize: '0.7rem' }}>Minor System Alert</span>
        </div>
      )}
    </div>
  );
}
