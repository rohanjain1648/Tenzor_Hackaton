import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VideoControls({ localStream, endCall }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const navigate = useNavigate();

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      });
    }
  };

  const handleEndCall = () => {
    endCall();
    navigate('/');
  };

  const btnStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'var(--color-bg-card)',
    color: 'var(--color-text-primary)'
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '1.5rem',
      padding: '1rem',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 'var(--radius-lg)'
    }}>
      <button 
        onClick={toggleMute} 
        style={{ ...btnStyle, backgroundColor: isMuted ? 'var(--color-danger)' : btnStyle.backgroundColor }}
      >
        {isMuted ? <MicOff /> : <Mic />}
      </button>
      
      <button 
        onClick={toggleVideo} 
        style={{ ...btnStyle, backgroundColor: isVideoOff ? 'var(--color-danger)' : btnStyle.backgroundColor }}
      >
        {isVideoOff ? <VideoOff /> : <Video />}
      </button>

      <button 
        onClick={handleEndCall} 
        style={{ ...btnStyle, backgroundColor: 'var(--color-danger)' }}
      >
        <PhoneOff />
      </button>
    </div>
  );
}
