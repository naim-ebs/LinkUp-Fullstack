import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, User, Maximize, Minimize } from 'lucide-react';

const VideoTile = ({ stream, userName, isLocal = false, audio = true, video = true, screenSharing = false }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('VideoTile: Setting srcObject for', userName);
      console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, id: t.id, readyState: t.readyState })));
      
      // Force update by clearing first
      videoRef.current.srcObject = null;
      
      // Use requestAnimationFrame to ensure the clear takes effect
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Force play
          videoRef.current.play().catch(e => {
            console.log('Autoplay prevented:', e.message);
          });
        }
      });
    }
    
    // Cleanup when stream changes
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, userName]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check if stream actually has video tracks
  const hasVideoTrack = stream && stream.getVideoTracks().length > 0;
  const hasAudioTrack = stream && stream.getAudioTracks().length > 0;

  // Toggle fullscreen on double click
  const handleDoubleClick = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Exit fullscreen on single click when in fullscreen
  const handleClick = async () => {
    if (isFullscreen && document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Error exiting fullscreen:', error);
      }
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-dark-800 rounded-xl overflow-hidden group w-full h-full cursor-pointer" 
      style={{ aspectRatio: isFullscreen ? 'auto' : '16/9', maxHeight: '100%', maxWidth: '100%' }}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      title="Double-click for fullscreen"
    >
      {stream && hasVideoTrack && video ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-900/20 to-dark-800">
          <div className="w-24 h-24 rounded-full bg-primary-600/20 flex items-center justify-center">
            <User className="w-12 h-12 text-primary-400" />
          </div>
        </div>
      )}
      
      {/* User info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {userName} {isLocal && '(You)'}
          </span>
          <div className="flex items-center gap-2">
            {audio ? (
              <Mic className="w-4 h-4 text-green-400" />
            ) : (
              <MicOff className="w-4 h-4 text-red-400" />
            )}
            {video ? (
              <VideoIcon className="w-4 h-4 text-green-400" />
            ) : (
              <VideoOff className="w-4 h-4 text-red-400" />
            )}
          </div>
        </div>
      </div>

      {/* Screen sharing indicator */}
      {screenSharing && (
        <div className="absolute top-4 left-4 px-3 py-1 bg-primary-600 rounded-full text-xs font-medium text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          Sharing Screen
        </div>
      )}

      {/* Fullscreen hint */}
      {!isFullscreen && hasVideoTrack && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1 text-xs text-white">
            <Maximize className="w-3 h-3" />
            Double-click for fullscreen
          </div>
        </div>
      )}

      {/* Fullscreen exit hint */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 bg-black/60 rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-white">
          <Minimize className="w-4 h-4" />
          Click to exit fullscreen
        </div>
      )}
    </div>
  );
};

export default VideoTile;
