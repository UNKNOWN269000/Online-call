import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';

const generateVoxNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
};

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
    
    // Stop and clear local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setRemoteStream(null);
    setCallActive(false);
    currentCallRef.current = null;
  }, [localStream]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let savedId = localStorage.getItem('vox_call_id');
    if (!savedId) {
      savedId = generateVoxNumber();
      localStorage.setItem('vox_call_id', savedId);
    }

    const peer = new Peer(savedId);
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

    return () => {
      peer.destroy();
    };
  }, []);

  const requestLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get local stream', err);
      setError('Microphone access denied. Please allow mic access to make calls.');
      return null;
    }
  };

  const answerCall = useCallback(async () => {
    if (incomingCall) {
      const stream = await requestLocalStream();
      if (!stream) return;

      incomingCall.answer(stream);
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
  }, [incomingCall, endCall]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const startCall = useCallback(async (remoteId: string) => {
    if (peerRef.current) {
      const stream = await requestLocalStream();
      if (!stream) return;

      const call = peerRef.current.call(remoteId, stream);
      call.on('stream', (userRemoteStream) => {
        setRemoteStream(userRemoteStream);
      });
      currentCallRef.current = call;
      setCallActive(true);

      call.on('close', () => {
        endCall();
      });
      
      call.on('error', () => {
        endCall();
      });
    }
  }, [endCall]);

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
