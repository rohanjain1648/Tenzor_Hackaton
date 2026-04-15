import React, { useEffect, useRef } from 'react';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { MessageSquare } from 'lucide-react';

export default function TranscriptPanel() {
  const { transcripts, interimText } = useTranscriptStore();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimText]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-accent-1)' }}>
        <MessageSquare size={18} />
        <h4 style={{ margin: 0 }}>Live Transcript</h4>
      </div>
      
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          paddingRight: '0.5rem'
        }}
      >
        {transcripts.map((t) => (
          <div 
            key={t.id} 
            style={{ 
              alignSelf: t.speaker === 'agent' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: t.speaker === 'agent' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: t.speaker === 'agent' ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
              {t.speaker.toUpperCase()} • {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.9rem' }}>{t.text}</div>
          </div>
        ))}
        
        {interimText && (
          <div style={{ 
            alignSelf: 'flex-start',
            maxWidth: '85%',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)'
          }}>
            {interimText}...
          </div>
        )}
        
        {transcripts.length === 0 && !interimText && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '2rem', fontSize: '0.9rem' }}>
            Awaiting conversation...
          </div>
        )}
      </div>
    </div>
  );
}
