import { Circle } from 'lucide-react';
import { useMeeting } from '../context/MeetingContext';

const RecordingIndicator = () => {
  const { isRecording, formatRecordingTime } = useMeeting();

  if (!isRecording) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass px-6 py-3 rounded-full border border-red-600/50 bg-red-600/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Circle className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <div className="absolute inset-0 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-sm font-semibold text-red-400">
            REC {formatRecordingTime()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecordingIndicator;
