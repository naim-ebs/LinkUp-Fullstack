import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';

const MeetingContext = createContext(null);

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) {
    throw new Error('useMeeting must be used within MeetingProvider');
  }
  return context;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const MeetingProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [userName, setUserName] = useState('');

  const peersRef = useRef({});
  const localStreamRef = useRef(null);

  // Join room
  const joinRoom = useCallback(async (roomIdToJoin, name) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      setUserName(name);

      socket.emit('join-room', {
        roomId: roomIdToJoin,
        userName: name,
        audio: true,
        video: true
      });

      setRoomId(roomIdToJoin);
      setIsInRoom(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to access camera/microphone. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Permission denied. Please allow camera and microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a camera/microphone and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera/microphone is already in use by another application. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera/microphone does not meet requirements. Try a different device.';
      } else if (error.name === 'TypeError') {
        errorMessage += 'Browser does not support media devices. Please use a modern browser.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      throw new Error(errorMessage);
    }
  }, [socket]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leave-room');
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.close();
    });

    setLocalStream(null);
    setScreenStream(null);
    setPeers({});
    setParticipants([]);
    setMessages([]);
    setIsInRoom(false);
    setRoomId(null);
    setScreenSharing(false);
    peersRef.current = {};
    localStreamRef.current = null;
  }, [socket, screenStream]);

  // Create peer connection
  const createPeerConnection = useCallback((userId) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle incoming stream
    let remoteStream = new MediaStream();
    
    peerConnection.ontrack = (event) => {
      console.log('Received track from', userId, ':', event.track.kind);
      
      // Add track to remote stream
      event.track.onunmute = () => {
        console.log('Track unmuted:', event.track.kind);
      };
      
      // Use the stream from the event, or build our own
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
      } else {
        remoteStream.addTrack(event.track);
      }
      
      // Update peers state to trigger re-render
      setPeers(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          stream: remoteStream
        }
      }));
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
          roomId
        });
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state for', userId, ':', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed') {
        console.warn('Connection issue with', userId, '- may need to reconnect');
      }
      
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        console.log('Successfully connected to', userId);
      }
    };

    peersRef.current[userId] = peerConnection;
    return peerConnection;
  }, [socket, roomId]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      if (audioEnabled) {
        // Turning off
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
        }
        setAudioEnabled(false);
        socket.emit('toggle-audio', { audio: false });
      } else {
        // Turning on
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
        } else {
          // If no audio track exists, get a new one
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const newAudioTrack = newStream.getAudioTracks()[0];
            
            // Add to local stream
            localStreamRef.current.addTrack(newAudioTrack);
            
            // Add audio track to all peer connections
            for (const pc of Object.values(peersRef.current)) {
              pc.addTrack(newAudioTrack, localStreamRef.current);
            }
            
            // Update local stream state to trigger re-render
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          } catch (error) {
            console.error('Error enabling audio:', error);
            alert('Failed to access microphone. Please check permissions.');
            return;
          }
        }
        setAudioEnabled(true);
        socket.emit('toggle-audio', { audio: true });
      }
    }
  }, [socket, audioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoEnabled) {
        // Turning off - stop the track to turn off camera light
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setVideoEnabled(false);
        socket.emit('toggle-video', { video: false });
        
        // Remove video track from all peer connections and renegotiate
        for (const [userId, pc] of Object.entries(peersRef.current)) {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          if (videoSender) {
            pc.removeTrack(videoSender);
            
            // Renegotiate
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('offer', { to: userId, offer, roomId });
            } catch (error) {
              console.error('Error renegotiating after removing video:', error);
            }
          }
        }
        
        // Update local stream state to trigger re-render (keep all existing tracks)
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      } else {
        // Turning on - get new video track
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          // Add to local stream
          localStreamRef.current.addTrack(newVideoTrack);
          
          // Update local stream state to trigger re-render (keep all existing tracks)
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          
          setVideoEnabled(true);
          socket.emit('toggle-video', { video: true });
          
          // Add video track to all peer connections and renegotiate
          for (const [userId, pc] of Object.entries(peersRef.current)) {
            pc.addTrack(newVideoTrack, localStreamRef.current);
            
            // Renegotiate
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('offer', { to: userId, offer, roomId });
            } catch (error) {
              console.error('Error renegotiating after adding video:', error);
            }
          }
        } catch (error) {
          console.error('Error enabling video:', error);
          alert('Failed to access camera. Please check permissions.');
        }
      }
    }
  }, [socket, videoEnabled, roomId]);

  // Toggle screen share
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!screenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });

        const screenTrack = stream.getVideoTracks()[0];
        
        // Replace video track in all peer connections with screen share track
        for (const pc of Object.values(peersRef.current)) {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          } else {
            pc.addTrack(screenTrack, stream);
          }
        }

        setScreenStream(stream);
        setScreenSharing(true);
        socket.emit('start-screen-share');

        // Handle screen share stop (when user clicks browser's stop button)
        screenTrack.onended = async () => {
          await stopScreenShare();
        };
      } else {
        await stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      if (error.name === 'NotAllowedError') {
        alert('Screen sharing permission denied.');
      }
    }
  }, [screenSharing, socket]);

  // Helper to stop screen share
  const stopScreenShare = useCallback(async () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    // Restore camera video track to peer connections
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoTrack) {
        for (const pc of Object.values(peersRef.current)) {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          
          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          }
        }
      }
    }

    setScreenStream(null);
    setScreenSharing(false);
    socket.emit('stop-screen-share');
  }, [screenStream, socket]);

  // Send message
  const sendMessage = useCallback((message) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', { message: message.trim() });
      
      setMessages(prev => [...prev, {
        userId: 'me',
        userName: 'You',
        message: message.trim(),
        timestamp: new Date().toISOString()
      }]);
    }
  }, [socket]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('room-joined', async ({ participants: roomParticipants, yourId }) => {
      console.log('Room joined, participants:', roomParticipants);
      setParticipants(roomParticipants);

      // Create peer connections for existing participants
      for (const participant of roomParticipants) {
        createPeerConnection(participant.id);
      }
    });

    socket.on('user-joined', async ({ userId, userName: newUserName, audio, video }) => {
      console.log('User joined:', userId);
      
      setParticipants(prev => [...prev, {
        id: userId,
        userName: newUserName,
        audio,
        video
      }]);

      // Create peer connection and send offer
      const pc = createPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('offer', { to: userId, offer, roomId });
    });

    socket.on('offer', async ({ from, offer }) => {
      console.log('Received offer from:', from);
      
      // Get existing peer connection or create new one
      let pc = peersRef.current[from];
      if (!pc) {
        pc = createPeerConnection(from);
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: from, answer, roomId });
    });

    socket.on('answer', async ({ from, answer }) => {
      console.log('Received answer from:', from);
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-left', ({ userId }) => {
      console.log('User left:', userId);
      
      setParticipants(prev => prev.filter(p => p.id !== userId));
      
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }

      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        return newPeers;
      });
    });

    socket.on('user-audio-toggled', ({ userId, audio }) => {
      setParticipants(prev =>
        prev.map(p => p.id === userId ? { ...p, audio } : p)
      );
    });

    socket.on('user-video-toggled', ({ userId, video }) => {
      console.log('User video toggled:', userId, video);
      setParticipants(prev =>
        prev.map(p => p.id === userId ? { ...p, video } : p)
      );
      
      // Force re-render of peer stream to show/hide video
      setPeers(prev => {
        if (prev[userId]) {
          return {
            ...prev,
            [userId]: { ...prev[userId] }
          };
        }
        return prev;
      });
    });

    socket.on('chat-message', ({ userId, userName: senderName, message, timestamp }) => {
      setMessages(prev => [...prev, {
        userId,
        userName: senderName,
        message,
        timestamp
      }]);
    });

    socket.on('user-started-screen-share', ({ userId }) => {
      console.log('User started screen sharing:', userId);
      setParticipants(prev =>
        prev.map(p => p.id === userId ? { ...p, screenSharing: true } : p)
      );
    });

    socket.on('user-stopped-screen-share', ({ userId }) => {
      console.log('User stopped screen sharing:', userId);
      setParticipants(prev =>
        prev.map(p => p.id === userId ? { ...p, screenSharing: false } : p)
      );
    });

    return () => {
      socket.off('room-joined');
      socket.off('user-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
      socket.off('user-audio-toggled');
      socket.off('user-video-toggled');
      socket.off('chat-message');
      socket.off('user-started-screen-share');
      socket.off('user-stopped-screen-share');
    };
  }, [socket, isConnected, roomId, createPeerConnection]);

  const value = {
    roomId,
    isInRoom,
    localStream,
    screenStream,
    peers,
    participants,
    messages,
    audioEnabled,
    videoEnabled,
    screenSharing,
    userName,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendMessage
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};
