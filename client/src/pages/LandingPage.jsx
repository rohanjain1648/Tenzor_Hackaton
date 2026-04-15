import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Video, UserCheck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');

  const startSession = () => {
    // Generate a new session ID if customer, or join a test session ID
    // In a real app this would call the backend to create a session
    const sessionId = 'test-session-123';
    navigate(`/session/${sessionId}?role=${role}`);
  };

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        TenZor Loan Origination
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', marginBottom: '3rem' }}>
        Intelligent Video-Based KYC and Risk Assessment
      </p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', width: '300px' }}>
          <Video size={48} color="var(--color-accent-1)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Live Verification</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Real-time face detection, age estimation, and geo-location tracking.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', width: '300px' }}>
          <UserCheck size={48} color="var(--color-accent-2)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Intent & Consent</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Automated speech-to-text with LLM powered consent extraction.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', width: '300px' }}>
          <ShieldCheck size={48} color="var(--color-success)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Instant Offers</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Real-time risk scoring and dynamic EMI calculations.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--color-bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-lg)' }}>
          <button 
            onClick={() => setRole('customer')}
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: 'var(--radius-md)', 
              background: role === 'customer' ? 'var(--color-accent-1)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Customer View
          </button>
          <button 
            onClick={() => setRole('agent')}
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: 'var(--radius-md)', 
              background: role === 'agent' ? 'var(--color-accent-2)' : 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Agent View
          </button>
        </div>
        
        <button 
          onClick={startSession}
          style={{
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            background: 'var(--color-success)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginTop: '1rem'
          }}
        >
          Start Live Session
        </button>
      </div>
    </div>
  );
}
