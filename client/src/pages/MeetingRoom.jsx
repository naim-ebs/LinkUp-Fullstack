import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import MeetingControls from '../components/MeetingControls';
import ChatPanel from '../components/ChatPanel';
import ParticipantsPanel from '../components/ParticipantsPanel';
import { useMeeting } from '../context/MeetingContext';

const MeetingRoom = () => {
  const { roomId } = useMeeting();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      {/* Header */}
      <div className="glass border-b border-dark-800/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">EBS Meeting Zone</h1>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-gray-400 bg-dark-800 px-2 py-1 rounded">
                  {roomId}
                </code>
                <button
                  onClick={copyRoomId}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  title="Copy Room ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-600/30">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 relative">
          <VideoGrid />
        </div>

        {/* Side panels */}
        {showChat && (
          <div className="w-80 border-l border-dark-800">
            <ChatPanel onClose={() => setShowChat(false)} />
          </div>
        )}

        {showParticipants && !showChat && (
          <div className="w-80 border-l border-dark-800">
            <ParticipantsPanel onClose={() => setShowParticipants(false)} />
          </div>
        )}
      </div>

      {/* Controls */}
      <MeetingControls
        onToggleChat={() => {
          setShowChat(!showChat);
          if (!showChat) setShowParticipants(false);
        }}
        onToggleParticipants={() => {
          setShowParticipants(!showParticipants);
          if (!showParticipants) setShowChat(false);
        }}
        showChat={showChat}
        showParticipants={showParticipants}
      />
    </div>
  );
};

export default MeetingRoom;
