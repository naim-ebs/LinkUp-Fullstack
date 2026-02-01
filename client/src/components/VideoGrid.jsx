import { useMeeting } from '../context/MeetingContext';
import VideoTile from './VideoTile';

const VideoGrid = () => {
  const { localStream, screenStream, peers, participants, userName, audioEnabled, videoEnabled, screenSharing } = useMeeting();

  const allStreams = [];

  // Add local stream
  if (localStream) {
    allStreams.push({
      id: 'local',
      stream: localStream,
      userName: userName,
      isLocal: true,
      audio: audioEnabled,
      video: videoEnabled,
      screenSharing: screenSharing
    });
  }

  // Add screen share stream (local user's screen share as separate tile)
  if (screenStream) {
    allStreams.push({
      id: 'screen-local',
      stream: screenStream,
      userName: `${userName}'s Screen`,
      isLocal: true,
      audio: false,
      video: true,
      screenSharing: true
    });
  }

  // Add peer streams - ONLY if participant still exists
  Object.entries(peers).forEach(([peerId, peerData]) => {
    if (peerData.stream) {
      const participant = participants.find(p => p.id === peerId);
      
      // Only show peer if they're in the participants list
      if (participant) {
        allStreams.push({
          id: peerId,
          stream: peerData.stream,
          userName: participant.userName,
          isLocal: false,
          audio: participant.audio ?? true,
          video: participant.video ?? true,
          screenSharing: participant.screenSharing ?? false
        });
      } else {
        console.warn('Peer stream exists for', peerId, 'but no matching participant - skipping display');
      }
    }
  });

  const getGridClass = () => {
    const count = allStreams.length;
    if (count === 1) return 'grid-cols-1 max-w-4xl mx-auto';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-2 md:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto';
    if (count === 5) return 'grid-cols-2 lg:grid-cols-3';
    if (count === 6) return 'grid-cols-2 md:grid-cols-3';
    if (count <= 9) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-hidden">
      <div className={`grid ${getGridClass()} gap-4 w-full h-full auto-rows-fr`} style={{ maxHeight: '100%', gridAutoRows: '1fr' }}>
        {allStreams.map((streamData) => (
          <VideoTile
            key={streamData.id}
            stream={streamData.stream}
            userName={streamData.userName}
            isLocal={streamData.isLocal}
            audio={streamData.audio}
            video={streamData.video}
            screenSharing={streamData.screenSharing}
          />
        ))}
        
        {allStreams.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <VideoIcon className="w-16 h-16 text-dark-600" />
              </div>
              <p className="text-gray-400 text-lg">Waiting for participants...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;
