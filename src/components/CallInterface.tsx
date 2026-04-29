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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="w-6 h-6" />
            VoxCall
          </h1>
          <p className="text-blue-100 text-sm mt-1">Free Peer-to-Peer Secure Calling</p>
        </div>

        <div className="p-6 space-y-8">
          {/* My ID Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Unique ID</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 p-3 rounded-xl font-mono text-sm break-all border border-slate-200">
                {peerId || 'Generating...'}
              </div>
              <button
                onClick={copyId}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-slate-600"
                title="Copy ID"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!callActive && !incomingCall && (
            <form onSubmit={handleStartCall} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Call Someone</label>
                <input
                  type="text"
                  placeholder="Enter recipient's ID"
                  value={remoteIdInput}
                  onChange={(e) => setRemoteIdInput(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!remoteIdInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Start Call
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
                <p className="text-sm text-slate-500 truncate w-48">{incomingCall.peer}</p>
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
          To test, open this page in two different browser tabs and call the other tab's ID.
        </p>
      </div>
    </div>
  );
};

export default CallInterface;
