import { useEffect, useRef } from 'react';
import VideoControls from './VideoControls';
import useFaceDetection from '../../hooks/useFaceDetection';
import FaceOverlay from './FaceOverlay';

export default function VideoCall({ role, localStream, remoteStream, connectionState, endCall }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Only detect face for the customer — agent's local feed is their own face, not the customer's
  const { detection } = useFaceDetection(localVideoRef, role === 'customer');

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
            autoPlay
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

        {/* Local Video (PiP style) */}
        <div style={{ flex: 1, ...videoContainerStyle, maxHeight: '300px' }}>
          <video
            ref={localVideoRef}
            autoPlay
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
