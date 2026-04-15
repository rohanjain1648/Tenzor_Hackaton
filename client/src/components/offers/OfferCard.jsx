import React from 'react';
import { CreditCard, Calendar, Percent, Check } from 'lucide-react';

export default function OfferCard({ offer, onAccept }) {
  const { tenure, amount, interestRate, emi, processingFee } = offer;

  return (
    <div className="glass-panel" style={{ 
      padding: '1.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '1rem',
      border: '1px solid var(--color-accent-1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        background: 'var(--color-accent-1)', 
        color: 'white', 
        padding: '2px 12px', 
        fontSize: '0.7rem',
        borderRadius: '0 0 0 8px'
      }}>
        RECOMMENDED
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Eligible Amount</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-accent-2)' }}>
            ₹{amount.toLocaleString()}
          </div>
        </div>
        <CreditCard size={24} color="var(--color-accent-1)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="var(--color-text-muted)" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Tenure</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tenure} Months</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Percent size={16} color="var(--color-text-muted)" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Interest</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{interestRate}% p.a.</div>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Monthly EMI</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{emi.toLocaleString()}</div>
        </div>
        <button 
          onClick={() => onAccept(offer)}
          style={{ 
            background: 'var(--color-success)', 
            color: 'white', 
            border: 'none', 
            padding: '0.6rem 1.2rem', 
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600
          }}
        >
          <Check size={18} />
          Accept
        </button>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        Processing Fee: ₹{processingFee.toLocaleString()} (incl. taxes)
      </div>
    </div>
  );
}
