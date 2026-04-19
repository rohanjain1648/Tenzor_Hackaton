import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Video, UserCheck, Copy, Check, Loader2, Link2, ArrowLeft } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'agent' | 'customer'
  const [sessionId, setSessionId] = useState('');
  const [createdSessionId, setCreatedSessionId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const createSession = async () => {
    setIsCreating(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignSource: 'direct' })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedSessionId(data.sessionId);
      } else {
        setError(data.error || 'Failed to create session');
      }
    } catch (err) {
      setError('Could not reach server. Is it running on port 3002?');
    } finally {
      setIsCreating(false);
    }
  };

  const customerLink = createdSessionId
    ? `${window.location.origin}/session/${createdSessionId}?role=customer`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(customerLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardBtn = (onClick, borderColor, children) => (
    <button
      onClick={onClick}
      style={{
        padding: '2rem',
        width: '280px',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-primary)',
        textAlign: 'center',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
    >
      {children}
    </button>
  );

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          TenZor Loan Origination
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
          Agentic AI · Video KYC · Real-Time Risk Assessment
        </p>
      </div>

      {/* Feature Cards */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {[
          { icon: <Video size={36} color="var(--color-accent-1)" />, title: 'Live Video KYC', desc: 'Real-time face detection, age estimation, and geo-location capture.' },
          { icon: <UserCheck size={36} color="var(--color-accent-2)" />, title: 'AI Risk Scoring', desc: 'LLM-powered intent analysis, consent extraction, and risk classification.' },
          { icon: <ShieldCheck size={36} color="var(--color-success)" />, title: 'Instant Offers', desc: 'Policy-driven EMI calculations with personalized loan offers in seconds.' }
        ].map(({ icon, title, desc }) => (
          <div key={title} className="glass-panel" style={{ padding: '1.5rem', width: '270px', textAlign: 'center' }}>
            <div style={{ marginBottom: '0.75rem' }}>{icon}</div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>{title}</h3>
            <p style={{ fontSize: '0.82rem' }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Role Selection */}
      {!mode && (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {cardBtn(() => setMode('agent'), 'var(--color-accent-1)',
            <>
              <Video size={48} color="var(--color-accent-1)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>I'm an Agent</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Create a new loan session and generate a customer invite link
              </p>
            </>
          )}
          {cardBtn(() => setMode('customer'), 'var(--color-accent-2)',
            <>
              <Link2 size={48} color="var(--color-accent-2)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>I'm a Customer</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Join a session using the link or Session ID your agent shared
              </p>
            </>
          )}
        </div>
      )}

      {/* Agent Flow */}
      {mode === 'agent' && (
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Create Loan Session</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            A unique session will be created. Share the generated link with your customer via WhatsApp, SMS, or email.
          </p>

          {!createdSessionId ? (
            <>
              {error && (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>
                  {error}
                </div>
              )}
              <button
                onClick={createSession}
                disabled={isCreating}
                style={{
                  width: '100%', padding: '1rem',
                  background: 'var(--gradient-hero)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  opacity: isCreating ? 0.7 : 1
                }}
              >
                {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Video size={20} />}
                {isCreating ? 'Creating Session...' : 'Create New Session'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Customer Link */}
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  ✓ Session created — share this link with your customer:
                </div>
                <div style={{
                  display: 'flex', gap: '0.5rem', alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)', padding: '0.75rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ flex: 1, fontSize: '0.72rem', wordBreak: 'break-all', color: 'var(--color-accent-2)' }}>
                    {customerLink}
                  </span>
                  <button
                    onClick={copyLink}
                    title="Copy link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--color-success)' : 'var(--color-text-muted)', padding: '4px', flexShrink: 0 }}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                  Session ID: <code style={{ color: 'var(--color-text-primary)' }}>{createdSessionId}</code>
                </div>
              </div>

              <button
                onClick={() => navigate(`/session/${createdSessionId}?role=agent`)}
                style={{
                  width: '100%', padding: '1rem',
                  background: 'var(--color-accent-1)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '1rem'
                }}
              >
                Start Session as Agent →
              </button>
            </div>
          )}

          <button
            onClick={() => { setMode(null); setCreatedSessionId(null); setError(''); }}
            style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}

      {/* Customer Flow */}
      {mode === 'customer' && (
        <div className="glass-panel" style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Join Your Session</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Enter the Session ID from the link your agent shared. You can find it at the end of the URL.
          </p>

          <input
            type="text"
            placeholder="Paste Session ID here..."
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sessionId.trim() && navigate(`/session/${sessionId.trim()}?role=customer`)}
            style={{
              width: '100%', padding: '0.75rem 1rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)', fontSize: '0.95rem',
              marginBottom: '1rem', boxSizing: 'border-box',
              outline: 'none'
            }}
          />

          <button
            onClick={() => sessionId.trim() && navigate(`/session/${sessionId.trim()}?role=customer`)}
            disabled={!sessionId.trim()}
            style={{
              width: '100%', padding: '1rem',
              background: sessionId.trim() ? 'var(--color-accent-2)' : 'rgba(255,255,255,0.1)',
              color: 'white', border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: sessionId.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 600, fontSize: '1rem'
            }}
          >
            Join Session →
          </button>

          <button
            onClick={() => { setMode(null); setSessionId(''); }}
            style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      )}
    </div>
  );
}
