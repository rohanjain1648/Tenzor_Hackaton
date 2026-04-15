import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import VideoCall from '../components/video/VideoCall';
import TranscriptPanel from '../components/stt/TranscriptPanel';
import ConsentDetector from '../components/stt/ConsentDetector';
import AgeEstimator from '../components/kyc/AgeEstimator';
import DeviceFingerprint from '../components/kyc/DeviceFingerprint';
import OfferCard from '../components/offers/OfferCard';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useGeolocation from '../hooks/useGeolocation';
import { useTranscriptStore } from '../stores/transcriptStore';
import { useKYCStore } from '../stores/kycStore';
import { useOfferStore } from '../stores/offerStore';
import { Mic, MicOff, Zap, ShieldAlert, Loader2 } from 'lucide-react';

export default function VideoSession() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'customer';
  
  const { transcripts } = useTranscriptStore();
  const { estimatedAge, location: kycLocation, deviceMetadata } = useKYCStore();
  const { assessment, policyResult, offers, isAssessing, setAssessing, setAssessment, setError } = useOfferStore();
  
  // Initialize speech recognition
  const { isListening, toggleListening } = useSpeechRecognition(sessionId, null, role);

  // Initialize signals
  useGeolocation();

  const runAssessment = async () => {
    setAssessing(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/assessments/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcript: transcripts,
          kycData: { estimatedAge, location: kycLocation, deviceMetadata }
        })
      });
      const data = await resp.json();
      if (data.success) {
        setAssessment(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', padding: '1rem', gap: '1rem', background: 'var(--color-bg-primary)' }}>
      {/* Main Video Area */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-panel" style={{ flex: 1, padding: '1rem', position: 'relative' }}>
          <VideoCall sessionId={sessionId} role={role} />
          
          {/* Toggle Listening Button Overlay */}
          <button 
            onClick={toggleListening}
            style={{
              position: 'absolute',
              bottom: '90px',
              right: '25px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isListening ? 'var(--color-success)' : 'var(--color-danger)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              zIndex: 10
            }}
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        </div>
        
        {/* Transcript Area */}
        <div className="glass-panel" style={{ height: '250px', padding: '1.25rem' }}>
          <TranscriptPanel />
        </div>
      </div>

      {/* Side Panel for KYC / Application Data */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1.5rem', overflowY: 'auto' }}>
         <h2 className="text-gradient">Application Review</h2>
         
         <ConsentDetector />
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AgeEstimator />
            
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
               <h4>Location & Fraud</h4>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                 <span style={{ color: 'var(--color-text-muted)' }}>Geo Coord:</span>
                 <span style={{ fontSize: '0.8rem' }}>
                   {kycLocation ? `${kycLocation.lat.toFixed(4)}, ${kycLocation.lng.toFixed(4)}` : 'Detecting...'}
                 </span>
               </div>
            </div>
            <DeviceFingerprint />
         </div>

         <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <h4>Extracted Info</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Income:</span>
              <span>{assessment?.customerProfile?.estimatedIncome ? `₹${assessment.customerProfile.estimatedIncome.toLocaleString()}` : '---'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Purpose:</span>
              <span>{assessment?.customerProfile?.purposeCategory || '---'}</span>
            </div>
         </div>

         {/* Assessment Results Area */}
         {assessment && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             <div style={{ 
               padding: '1rem', 
               background: policyResult?.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
               borderRadius: 'var(--radius-md)',
               border: `1px solid ${policyResult?.passed ? 'var(--color-success)' : 'var(--color-danger)'}`
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 {policyResult?.passed ? <Zap color="var(--color-success)" size={18} /> : <ShieldAlert color="var(--color-danger)" size={18} />}
                 <h4 style={{ margin: 0 }}>Policy Decision: {policyResult?.passed ? 'PASS' : 'REJECT'}</h4>
               </div>
               <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                 Risk: {assessment.riskClassification.riskBand} ({assessment.riskClassification.riskScore}/100)
               </div>
               {policyResult?.violations?.length > 0 && (
                 <ul style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                    {policyResult.violations.map((v, i) => <li key={i}>{v}</li>)}
                 </ul>
               )}
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Calculated Offers</h4>
                {offers.length > 0 ? (
                  offers.map((o, i) => <OfferCard key={i} offer={o} onAccept={() => alert('Offer Accepted!')} />)
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No eligible offers found.</div>
                )}
             </div>
           </div>
         )}

         {/* Action Button */}
         {role === 'agent' && (
           <button 
             onClick={runAssessment}
             disabled={isAssessing}
             style={{
               width: '100%',
               padding: '1rem',
               background: 'var(--gradient-hero)',
               color: 'white',
               border: 'none',
               borderRadius: 'var(--radius-md)',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               gap: '0.75rem',
               fontWeight: 600,
               marginTop: 'auto'
             }}
           >
             {isAssessing ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
             {isAssessing ? 'Analyzing...' : 'Generate AI Risk Assessment'}
           </button>
         )}
      </div>
    </div>
  );
}
