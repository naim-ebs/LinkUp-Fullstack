import { X, Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useMeeting } from '../context/MeetingContext';

const ParticipantsPanel = ({ onClose }) => {
  const { participants, userName, audioEnabled, videoEnabled } = useMeeting();

  const ParticipantItem = ({ name, audio, video, isYou = false }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-dark-800 hover:bg-dark-750 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
        <User className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {name} {isYou && <span className="text-primary-400">(You)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {audio ? (
          <Mic className="w-4 h-4 text-green-400" />
        ) : (
          <MicOff className="w-4 h-4 text-red-400" />
        )}
        {video ? (
          <Video className="w-4 h-4 text-green-400" />
        ) : (
          <VideoOff className="w-4 h-4 text-red-400" />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col glass rounded-l-2xl border-l border-dark-800/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-800">
        <div>
          <h3 className="text-lg font-semibold text-white">Participants</h3>
          <p className="text-sm text-gray-400">{participants.length + 1} in meeting</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Participants list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Current user */}
        <ParticipantItem
          name={userName}
          audio={audioEnabled}
          video={videoEnabled}
          isYou={true}
        />

        {/* Other participants */}
        {participants.map((participant) => (
          <ParticipantItem
            key={participant.id}
            name={participant.userName}
            audio={participant.audio}
            video={participant.video}
          />
        ))}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
