import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import VideoCall from '../components/video/VideoCall';
import TranscriptPanel from '../components/stt/TranscriptPanel';
import OfferCard from '../components/offers/OfferCard';
import useWebRTC from '../hooks/useWebRTC';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useGeolocation from '../hooks/useGeolocation';
import { useTranscriptStore } from '../stores/transcriptStore';
import { useKYCStore } from '../stores/kycStore';
import { useOfferStore } from '../stores/offerStore';
import {
  Mic, MicOff, Zap, ShieldAlert, Loader2,
  MapPin, User, CheckCircle, AlertCircle
} from 'lucide-react';

const CONSENT_KEYWORDS = ['i agree', 'i consent', 'yes i do', 'i accept', 'confirm', 'proceed', 'authorized'];

export default function VideoSession() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'customer';

  const { transcripts, addTranscript } = useTranscriptStore();
  const { estimatedAge, location: kycLocation } = useKYCStore();
  const { assessment, policyResult, offers, isAssessing, setAssessing, setAssessment, setError } = useOfferStore();

  // Agent receives customer KYC signals in real-time via socket
  const [remoteKYC, setRemoteKYC] = useState({ age: null, location: null, consent: false });

  const {
    localStream, remoteStream, connectionState,
    socketConnected, initMedia, initSocket, endCall, socketRef
  } = useWebRTC(sessionId, role);

  const { isListening, toggleListening, startListening } = useSpeechRecognition(sessionId, socketRef, role);
  useGeolocation();

  // Start media + socket on mount
  useEffect(() => {
    initMedia().then(() => initSocket());
    return () => endCall();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start STT when socket connects so both sides capture their own voice
  useEffect(() => {
    if (socketConnected) startListening();
  }, [socketConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Register socket event listeners once connected
  useEffect(() => {
    if (!socketConnected || !socketRef.current) return;
    const socket = socketRef.current;

    // Both roles: receive remote party's transcript lines
    const handleTranscriptReceived = ({ text, isFinal, timestamp }) => {
      if (isFinal) {
        addTranscript({ text, isFinal, timestamp, speaker: role === 'agent' ? 'customer' : 'agent' });
      }
    };

    // Agent: receive customer KYC signals (age, location, consent)
    const handleKYCSignal = ({ type, data }) => {
      setRemoteKYC(prev => {
        if (type === 'age-estimate') return { ...prev, age: data.estimatedAge };
        if (type === 'location')     return { ...prev, location: data.location };
        if (type === 'consent')      return { ...prev, consent: data.consentDetected };
        return prev;
      });
    };

    socket.on('transcript-received', handleTranscriptReceived);
    socket.on('kyc-signal-update', handleKYCSignal);

    return () => {
      socket.off('transcript-received', handleTranscriptReceived);
      socket.off('kyc-signal-update', handleKYCSignal);
    };
  }, [socketConnected, role, addTranscript]);

  // Customer: push age estimate to agent whenever it updates (or socket first connects)
  useEffect(() => {
    if (role !== 'customer' || !socketConnected || !socketRef.current || !estimatedAge) return;
    socketRef.current.emit('kyc-signal', { type: 'age-estimate', data: { estimatedAge }, sessionId });
  }, [estimatedAge, role, sessionId, socketConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Customer: push location to agent (re-emits when socket connects so buffered location is sent)
  useEffect(() => {
    if (role !== 'customer' || !socketConnected || !socketRef.current || !kycLocation) return;
    socketRef.current.emit('kyc-signal', { type: 'location', data: { location: kycLocation }, sessionId });
  }, [kycLocation, role, sessionId, socketConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Customer: push consent state derived from own transcripts
  useEffect(() => {
    if (role !== 'customer' || !socketConnected || !socketRef.current) return;
    const allText = transcripts.filter(t => t.speaker === 'customer').map(t => t.text.toLowerCase()).join(' ');
    const consentDetected = CONSENT_KEYWORDS.some(kw => allText.includes(kw));
    socketRef.current.emit('kyc-signal', { type: 'consent', data: { consentDetected }, sessionId });
  }, [transcripts, role, sessionId, socketConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const runAssessment = async () => {
    setAssessing(true);
    // Agent uses customer's KYC data received via socket
    const kycData = role === 'agent'
      ? { estimatedAge: remoteKYC.age, location: remoteKYC.location }
      : { estimatedAge, location: kycLocation };
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const resp = await fetch(`${apiUrl}/api/assessments/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, transcript: transcripts, kycData })
      });
      const data = await resp.json();
      if (data.success) setAssessment(data);
      else setError(data.error);
    } catch (err) {
      setError(err.message);
    }
  };

  // ─── Shared mic button ────────────────────────────────────────────────────
  const MicButton = () => (
    <button
      onClick={toggleListening}
      style={{
        position: 'absolute', bottom: '90px', right: '25px',
        width: '40px', height: '40px', borderRadius: '50%',
        backgroundColor: isListening ? 'var(--color-success)' : 'var(--color-danger)',
        border: 'none', color: 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 10
      }}
    >
      {isListening ? <Mic size={20} /> : <MicOff size={20} />}
    </button>
  );

  // ─── Customer View ────────────────────────────────────────────────────────
  if (role === 'customer') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '1rem', gap: '1rem', background: 'var(--color-bg-primary)' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '1rem', position: 'relative' }}>
          <VideoCall role={role} localStream={localStream} remoteStream={remoteStream} connectionState={connectionState} endCall={endCall} />
          <MicButton />
        </div>
        <div className="glass-panel" style={{ height: '200px', padding: '1.25rem' }}>
          <TranscriptPanel />
        </div>
      </div>
    );
  }

  // ─── Agent View ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', padding: '1rem', gap: '1rem', background: 'var(--color-bg-primary)' }}>

      {/* Left: Video + Transcript */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '1rem', position: 'relative' }}>
          <VideoCall role={role} localStream={localStream} remoteStream={remoteStream} connectionState={connectionState} endCall={endCall} />
          <MicButton />
        </div>
        <div className="glass-panel" style={{ height: '250px', padding: '1.25rem' }}>
          <TranscriptPanel />
        </div>
      </div>

      {/* Right: Customer Intel + Assessment */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.25rem', overflowY: 'auto' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.3rem' }}>Customer Intel</h2>

        {/* Consent */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem',
          background: remoteKYC.consent ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${remoteKYC.consent ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`
        }}>
          {remoteKYC.consent
            ? <CheckCircle size={18} color="var(--color-success)" />
            : <AlertCircle size={18} color="var(--color-warning)" />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            Verbal Consent: {remoteKYC.consent ? 'CAPTURED' : 'AWAITING'}
          </span>
        </div>

        {/* Age estimate from customer */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={20} color="var(--color-accent-2)" />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>AI Age Estimate (Customer)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {remoteKYC.age ? `${remoteKYC.age} yrs` : 'Awaiting feed…'}
              </div>
            </div>
          </div>
          {remoteKYC.age && remoteKYC.age < 21 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-danger)' }}>
              <ShieldAlert size={16} />
              <span style={{ fontSize: '0.7rem' }}>Below min. age</span>
            </div>
          )}
        </div>

        {/* Location from customer */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <MapPin size={16} color="var(--color-accent-1)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Customer Location</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Geo Coord:</span>
            <span style={{ fontSize: '0.82rem' }}>
              {remoteKYC.location
                ? `${remoteKYC.location.lat.toFixed(4)}, ${remoteKYC.location.lng.toFixed(4)}`
                : 'Awaiting…'}
            </span>
          </div>
        </div>

        {/* Extracted from LLM assessment */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.75rem' }}>Extracted Info</div>
          {[
            ['Income', assessment?.customerProfile?.estimatedIncome ? `₹${assessment.customerProfile.estimatedIncome.toLocaleString()}` : '---'],
            ['Purpose', assessment?.customerProfile?.purposeCategory || '---'],
            ['Employment', assessment?.customerProfile?.employmentType || '---'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{label}:</span>
              <span style={{ fontSize: '0.82rem' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Policy + Offers (post-assessment) */}
        {assessment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem',
              background: policyResult?.passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${policyResult?.passed ? 'var(--color-success)' : 'var(--color-danger)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {policyResult?.passed
                  ? <Zap color="var(--color-success)" size={18} />
                  : <ShieldAlert color="var(--color-danger)" size={18} />}
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>
                  Policy: {policyResult?.passed ? 'PASS ✓' : 'REJECT ✗'}
                </h4>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Risk Band: <strong style={{ color: 'var(--color-text-primary)' }}>{assessment.riskClassification.riskBand}</strong>
                {' '}({assessment.riskClassification.riskScore}/100)
              </div>
              {policyResult?.violations?.length > 0 && (
                <ul style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.5rem', paddingLeft: '1.2rem', margin: '0.5rem 0 0' }}>
                  {policyResult.violations.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loan Offers</div>
            {offers.length > 0 ? (
              offers.map((o, i) => <OfferCard key={i} offer={o} onAccept={() => alert('Offer accepted!')} />)
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No eligible offers.</div>
            )}
          </div>
        )}

        {/* Assessment CTA */}
        <button
          onClick={runAssessment}
          disabled={isAssessing}
          style={{
            width: '100%', padding: '1rem',
            background: isAssessing ? 'rgba(99,102,241,0.4)' : 'var(--gradient-hero)',
            color: 'white', border: 'none', borderRadius: 'var(--radius-md)',
            cursor: isAssessing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            fontWeight: 600, marginTop: 'auto'
          }}
        >
          {isAssessing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          {isAssessing ? 'Analyzing…' : 'Generate AI Risk Assessment'}
        </button>
      </div>
    </div>
  );
}
