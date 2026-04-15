import React, { useEffect, useRef } from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import VideoControls from './VideoControls';
import useFaceDetection from '../../hooks/useFaceDetection';
import FaceOverlay from './FaceOverlay';

export default function VideoCall({ sessionId, role }) {
  const { 
    localStream, 
    remoteStream, 
    connectionState, 
    initMedia, 
    initSocket, 
    endCall 
  } = useWebRTC(sessionId, role);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  // Real-time face detection on local stream
  const { detection } = useFaceDetection(localVideoRef);

  useEffect(() => {
    // Start media and socket connection when component mounts
    initMedia().then(() => {
      initSocket();
    });
    return () => endCall();
  }, [initMedia, initSocket, endCall]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Video aspect ratio container
  const videoContainerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ flex: 1, display: 'flex', gap: '1rem' }}>
        
        {/* Remote Video (Main) */}
        <div style={{ flex: 2, ...videoContainerStyle }}>
          <video 
            ref={remoteVideoRef} 
            autoplay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {!remoteStream && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'gray' }}>
              {connectionState === 'connecting' ? 'Connecting to peer...' : 'Waiting for peer...'}
            </div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4 }}>
            {role === 'customer' ? 'Agent' : 'Customer'}
          </div>
        </div>

        {/* Local Video (PiP style or Side-by-side) */}
        <div style={{ flex: 1, ...videoContainerStyle, maxHeight: '300px' }}>
          <video 
            ref={localVideoRef} 
            autoplay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <FaceOverlay detection={detection} />
           <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 4 }}>
            You ({role})
          </div>
        </div>

      </div>

      <VideoControls localStream={localStream} endCall={endCall} />
    </div>
  );
}
