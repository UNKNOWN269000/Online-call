import { useState, useEffect, useRef, type FC, type FormEvent } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Copy, Check, User, PhoneIncoming } from 'lucide-react';
import { usePeer } from '../hooks/usePeer';
import { cn } from '../lib/utils';

const CallInterface: FC = () => {
  const {
    peerId,
    remoteStream,
    incomingCall,
    callActive,
    isMuted,
    error,
    setError,
    answerCall,
    rejectCall,
    startCall,
    endCall,
    toggleMute
  } = usePeer();

  const [remoteIdInput, setRemoteIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegistered, setIsRegistered] = useState(!!localStorage.getItem('vox_call_id'));
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const copyId = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartCall = (e: FormEvent) => {
    e.preventDefault();
    if (remoteIdInput.trim()) {
      setError(null);
      startCall(remoteIdInput.trim());
    }
  };

  const handleRegister = () => {
    setIsRegistered(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Phone className="w-6 h-6" />
                VoxCall
              </h1>
              <p className="text-blue-100 text-sm mt-1">Free Peer-to-Peer Secure Calling</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-blue-500 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter border border-blue-400">
                {isRegistered ? 'Online' : 'Guest'}
              </div>
              {isRegistered && (
                <div className={cn(
                  "flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border",
                  callActive ? "bg-green-500/20 border-green-400 text-green-100" : "bg-slate-800/20 border-slate-400/30 text-blue-200"
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", callActive ? "bg-green-400 animate-pulse" : "bg-slate-400")} />
                  Mic: {callActive ? 'Active' : 'Off'}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isRegistered ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Welcome to VoxCall</h2>
              <p className="text-slate-500 text-sm mt-2">
                Register to get your permanent Vox Number. This number will be yours as long as you use this device.
              </p>
            </div>
            <button
              onClick={handleRegister}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group"
            >
              Get My Number
              <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">No Personal Data Required</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* My ID Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Vox Number</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 p-3 rounded-xl font-mono text-lg font-bold tracking-widest text-blue-700 border border-slate-200">
                  {peerId ? peerId.match(/.{1,3}/g)?.join('-') : 'Checking...'}
                </div>
                <button
                  onClick={copyId}
                  className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600"
                  title="Copy Number"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            {!callActive && !incomingCall && (
              <form onSubmit={handleStartCall} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dial Number</label>
                  <input
                    type="text"
                    placeholder="000-000"
                    value={remoteIdInput}
                    onChange={(e) => setRemoteIdInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-xl font-mono tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!remoteIdInput.trim() || !peerId}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Dial Now
                </button>
              </form>
            )}

            {/* Incoming Call Notification */}
            {incomingCall && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center gap-4 animate-bounce-subtle">
                <div className="bg-blue-100 p-4 rounded-full">
                  <PhoneIncoming className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-slate-800">Incoming Call</h3>
                  <p className="text-sm font-mono text-blue-600 font-bold">
                    {incomingCall.peer.match(/.{1,3}/g)?.join('-')}
                  </p>
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    onClick={answerCall}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Answer
                  </button>
                  <button
                    onClick={rejectCall}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Active Call UI */}
            {callActive && (
              <div className="flex flex-col items-center gap-8 py-4">
                <div className="relative">
                  <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center ring-4 ring-blue-50">
                    <User className="w-16 h-16 text-slate-400" />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-800">In Call</h3>
                  <p className="text-slate-500 text-sm">Secure connection established</p>
                </div>

                <audio ref={remoteAudioRef} autoPlay />

                <div className="flex items-center gap-6">
                  <button
                    onClick={toggleMute}
                    className={cn(
                      "p-4 rounded-full transition-all",
                      isMuted ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={endCall}
                    className="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg shadow-red-200 transition-all hover:scale-105"
                  >
                    <PhoneOff className="w-7 h-7" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            End-to-End Encrypted via WebRTC
          </p>
        </div>
      </div>
      
      {/* Help info */}
      <div className="mt-8 text-center max-w-sm">
        <p className="text-slate-500 text-sm">
          To test, open this page in two different browser tabs and dial the other tab's number.
        </p>
      </div>
    </div>
  );
};

export default CallInterface;
