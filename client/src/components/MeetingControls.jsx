import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MessageSquare, Users } from 'lucide-react';
import { useMeeting } from '../context/MeetingContext';

const MeetingControls = ({ onToggleChat, onToggleParticipants, showChat, showParticipants }) => {
  const {
    audioEnabled,
    videoEnabled,
    screenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveRoom,
    participants
  } = useMeeting();

  const ControlButton = ({ onClick, active, activeColor = 'bg-primary-600', inactiveColor = 'bg-red-600', children, label }) => (
    <button
      onClick={onClick}
      className={`relative group p-4 rounded-full transition-all duration-200 ${
        active ? activeColor : inactiveColor
      } hover:scale-110 active:scale-95 shadow-lg`}
      title={label}
    >
      {children}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </span>
    </button>
  );

  return (
    <div className="glass rounded-t-3xl p-6 border-t border-dark-800/50">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left side - Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleParticipants}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showParticipants ? 'bg-primary-600' : 'bg-dark-800 hover:bg-dark-700'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">{participants.length + 1}</span>
          </button>
        </div>

        {/* Center - Main controls */}
        <div className="flex items-center gap-4">
          <ControlButton
            onClick={toggleAudio}
            active={audioEnabled}
            label={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </ControlButton>

          <ControlButton
            onClick={toggleVideo}
            active={videoEnabled}
            label={videoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {videoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </ControlButton>

          <button
            onClick={leaveRoom}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
            title="Leave Meeting"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>

          <ControlButton
            onClick={toggleScreenShare}
            active={!screenSharing}
            activeColor={screenSharing ? 'bg-green-600' : 'bg-dark-800 hover:bg-dark-700'}
            inactiveColor="bg-green-600"
            label={screenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <MonitorUp className="w-6 h-6 text-white" />
          </ControlButton>
        </div>

        {/* Right side - Additional controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              showChat ? 'bg-primary-600' : 'bg-dark-800 hover:bg-dark-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingControls;
