import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';

export const usePeer = () => {
  const [peerId, setPeerId] = useState<string>('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<MediaConnection | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const peerRef = useRef<Peer | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);

  const endCall = useCallback(() => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }
    setRemoteStream(null);
    setCallActive(false);
    currentCallRef.current = null;
  }, []);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setError(null);
    });

    peer.on('call', (call) => {
      setIncomingCall(call);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(err.type === 'peer-unavailable' ? 'Recipient ID not found or offline.' : 'Connection error occurred.');
      setCallActive(false);
    });

    // Get local media
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        setLocalStream(stream);
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
      });

    return () => {
      peer.destroy();
    };
  }, []);

  const answerCall = useCallback(() => {
    if (incomingCall && localStream) {
      incomingCall.answer(localStream);
      incomingCall.on('stream', (userRemoteStream) => {
        setRemoteStream(userRemoteStream);
      });
      
      incomingCall.on('close', () => {
        endCall();
      });

      currentCallRef.current = incomingCall;
      setIncomingCall(null);
      setCallActive(true);
    }
  }, [incomingCall, localStream, endCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const startCall = useCallback((remoteId: string) => {
    if (peerRef.current && localStream) {
      const call = peerRef.current.call(remoteId, localStream);
      call.on('stream', (userRemoteStream) => {
        setRemoteStream(userRemoteStream);
      });
      currentCallRef.current = call;
      setCallActive(true);

      call.on('close', () => {
        endCall();
      });
    }
  }, [localStream, endCall]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  return {
    peerId,
    remoteStream,
    localStream,
    incomingCall,
    callActive,
    isMuted,
    answerCall,
    rejectCall,
    startCall,
    endCall,
    error,
    setError,
    toggleMute
  };
};
