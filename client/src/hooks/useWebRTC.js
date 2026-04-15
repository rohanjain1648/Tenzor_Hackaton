import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const STUN_SERVER = 'stun:stun.l.google.com:19302';

export default function useWebRTC(sessionId, role) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected
  
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const initSocket = useCallback(() => {
    if (socketRef.current) return;
    
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to socket at:', socketUrl);
    socketRef.current = io(socketUrl);
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      socketRef.current.emit('join-room', { sessionId, role });
    });

    socketRef.current.on('user-joined', async ({ socketId, role: remoteRole }) => {
      console.log(`User joined: ${socketId} as ${remoteRole}`);
      // If we are the customer, we initiate the call when an agent joins
      if (role === 'customer') {
        await createOffer();
      }
    });

    socketRef.current.on('offer', async ({ sdp }) => {
      console.log('Received offer');
      await createAnswer(sdp);
    });

    socketRef.current.on('answer', async ({ sdp }) => {
      console.log('Received answer');
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        setConnectionState('connected');
      }
    });

    socketRef.current.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });
  }, [sessionId, role]);

  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    setConnectionState('connecting');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: STUN_SERVER }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          sessionId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        setConnectionState('connected');
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('disconnected');
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sessionId]);

  const createOffer = async () => {
    const pc = createPeerConnection();
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { sdp: pc.localDescription, sessionId });
    } catch (err) {
      console.error('Error creating offer', err);
    }
  };

  const createAnswer = async (sdp) => {
    const pc = createPeerConnection();
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit('answer', { sdp: pc.localDescription, sessionId });
      setConnectionState('connected');
    } catch (err) {
      console.error('Error creating answer', err);
    }
  };

  const endCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('disconnected');
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };
  
  // Cleanup
  useEffect(() => {
    return () => { endCall(); };
  }, []);

  return {
    localStream,
    remoteStream,
    connectionState,
    initMedia,
    initSocket,
    endCall,
    socket: socketRef.current
  };
}
