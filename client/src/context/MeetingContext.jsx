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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

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

    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
          }
        }, 100);
      }
      
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      setRecordingTime(0);
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
  }, [socket, screenStream, isRecording]);

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
    const remoteStream = new MediaStream();
    
    peerConnection.ontrack = (event) => {
      console.log('=== ONTRACK EVENT ===');
      console.log('Received track from', userId, ':', event.track.kind, 'readyState:', event.track.readyState);
      console.log('Track ID:', event.track.id);
      console.log('Streams in event:', event.streams?.length || 0);
      
      // Remove existing track of same kind if it exists
      const existingTracks = remoteStream.getTracks().filter(t => t.kind === event.track.kind);
      existingTracks.forEach(track => {
        console.log('Removing old', track.kind, 'track with ID:', track.id);
        remoteStream.removeTrack(track);
        track.stop();
      });
      
      // Add new track
      remoteStream.addTrack(event.track);
      console.log('Added', event.track.kind, 'track. Stream now has', remoteStream.getTracks().length, 'tracks');
      console.log('Video tracks:', remoteStream.getVideoTracks().length, 'Audio tracks:', remoteStream.getAudioTracks().length);
      
      // Handle track ended event
      event.track.onended = () => {
        console.log('Track ended for', userId, ':', event.track.kind);
        remoteStream.removeTrack(event.track);
        // Only update if peer connection still exists
        if (!peersRef.current[userId]) {
          console.log('Ignoring track ended - peer already removed');
          return;
        }
        // Force re-render with new stream object
        setPeers(prev => {
          if (!peersRef.current[userId]) return prev;
          return {
            ...prev,
            [userId]: {
              ...prev[userId],
              stream: new MediaStream(remoteStream.getTracks())
            }
          };
        });
      };
      
      // CRITICAL: Always create a NEW MediaStream object to trigger React re-render
      // Only update if this peer connection still exists (user hasn't left)
      setPeers(prev => {
        if (!peersRef.current[userId]) {
          console.log('Peer connection no longer exists for', userId, '- user has left');
          return prev;
        }
        
        // Create a completely new stream to ensure React detects the change
        const newStream = new MediaStream(remoteStream.getTracks());
        console.log('Creating new stream object for React re-render');
        console.log('New stream has', newStream.getTracks().length, 'tracks');
        
        return {
          ...prev,
          [userId]: {
            ...prev[userId],
            stream: newStream
          }
        };
      });
      console.log('=== ONTRACK EVENT COMPLETE ===');
    };

    // Monitor connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state for', userId, ':', peerConnection.connectionState);
    };

    // Monitor negotiation needed
    peerConnection.onnegotiationneeded = async () => {
      console.log('Negotiation needed for', userId);
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
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      
      if (!audioTrack) {
        console.error('No audio track available');
        return;
      }
      
      if (audioEnabled) {
        // Turning off - disable the track
        audioTrack.enabled = false;
        setAudioEnabled(false);
        socket.emit('toggle-audio', { audio: false });
        console.log('Audio disabled - track enabled:', audioTrack.enabled, 'readyState:', audioTrack.readyState);
      } else {
        // Turning on - enable the track
        audioTrack.enabled = true;
        setAudioEnabled(true);
        socket.emit('toggle-audio', { audio: true });
        console.log('Audio enabled - track enabled:', audioTrack.enabled, 'readyState:', audioTrack.readyState);
        
        // Verify the track is being sent in all peer connections
        for (const [userId, pc] of Object.entries(peersRef.current)) {
          const senders = pc.getSenders();
          const audioSender = senders.find(s => s.track?.kind === 'audio');
          if (audioSender && audioSender.track) {
            console.log(`Audio sender for ${userId} - track ID: ${audioSender.track.id}, enabled: ${audioSender.track.enabled}, readyState: ${audioSender.track.readyState}`);
          } else {
            console.warn(`No audio sender found for ${userId}`);
          }
        }
      }
    }
  }, [socket, audioEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      
      if (videoEnabled) {
        // Turning off - stop and remove the track
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setVideoEnabled(false);
        socket.emit('toggle-video', { video: false });
        
        console.log('=== TURNING VIDEO OFF ===');
        
        // Remove video sender from all peer connections and renegotiate
        for (const [userId, pc] of Object.entries(peersRef.current)) {
          try {
            const senders = pc.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            
            if (videoSender) {
              pc.removeTrack(videoSender);
              console.log('Removed video sender for', userId);
              
              // Renegotiate
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit('offer', { to: userId, offer, roomId });
              console.log('✓ Sent offer (video removed) to', userId);
            }
          } catch (error) {
            console.error('Error turning off video for', userId, ':', error);
          }
        }
        
        // Update local stream state
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        console.log('=== VIDEO OFF COMPLETE ===');
        
      } else {
        // Turning on - get new video track
        try {
          console.log('=== TURNING VIDEO ON ===');
          
          const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }, 
            audio: false 
          });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          console.log('✓ Got new video track:', newVideoTrack.id, 'readyState:', newVideoTrack.readyState);
          
          // Add to local stream
          localStreamRef.current.addTrack(newVideoTrack);
          
          // Update local stream state
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          
          setVideoEnabled(true);
          socket.emit('toggle-video', { video: true });
          
          // Add video track to all peer connections and renegotiate
          const renegotiationPromises = [];
          
          for (const [userId, pc] of Object.entries(peersRef.current)) {
            const promise = (async () => {
              try {
                console.log('--- Processing peer:', userId, '---');
                
                // Add the new track
                const sender = pc.addTrack(newVideoTrack, localStreamRef.current);
                console.log('✓ Added new video track for', userId, 'Sender:', sender.track?.id);
                
                // Small delay to ensure track is attached
                await new Promise(resolve => setTimeout(resolve, 50));
                
                // Renegotiate to notify remote peer
                console.log('Creating offer for', userId);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                console.log('✓ Local description set');
                
                socket.emit('offer', { to: userId, offer, roomId });
                console.log('✓ Offer sent to', userId);
                
              } catch (error) {
                console.error('✗ Error enabling video for', userId, ':', error);
              }
            })();
            
            renegotiationPromises.push(promise);
          }
          
          await Promise.allSettled(renegotiationPromises);
          console.log('=== VIDEO ON COMPLETE ===');
          
        } catch (error) {
          console.error('Error accessing camera:', error);
          alert('Failed to access camera. Please check permissions.');
          setVideoEnabled(false);
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
      console.log('=== RECEIVED OFFER ===');
      console.log('From:', from);
      console.log('Offer type:', offer.type);
      
      try {
        // Get existing peer connection or create new one
        let pc = peersRef.current[from];
        if (!pc) {
          console.log('No existing peer connection, creating new one');
          pc = createPeerConnection(from);
        }
        
        console.log('Current signaling state:', pc.signalingState);
        
        // Handle rollback if we have a local offer pending
        if (pc.signalingState === 'have-local-offer') {
          console.log('Rolling back local offer before accepting remote offer');
          await pc.setLocalDescription({ type: 'rollback' });
        }
        
        // Set remote description
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Remote description set, signaling state now:', pc.signalingState);
        
        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Local description set, signaling state now:', pc.signalingState);
        
        socket.emit('answer', { to: from, answer, roomId });
        console.log('Answer sent to', from);
        console.log('=== OFFER HANDLING COMPLETE ===');
      } catch (error) {
        console.error('Error handling offer from', from, ':', error);
      }
    });

    socket.on('answer', async ({ from, answer }) => {
      console.log('=== RECEIVED ANSWER ===');
      console.log('From:', from);
      console.log('Answer type:', answer.type);
      
      try {
        const pc = peersRef.current[from];
        if (pc) {
          console.log('Current signaling state:', pc.signalingState);
          
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Remote description set, signaling state now:', pc.signalingState);
            console.log('=== ANSWER HANDLING COMPLETE ===');
          } else {
            console.warn('Unexpected signaling state for answer:', pc.signalingState);
          }
        } else {
          console.error('No peer connection found for', from);
        }
      } catch (error) {
        console.error('Error handling answer from', from, ':', error);
      }
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-left', ({ userId }) => {
      console.log('=== USER LEFT EVENT ===' );
      console.log('User left:', userId);
      console.log('Current peers:', Object.keys(peersRef.current));
      console.log('Current participants:', participants.map(p => p.id));
      
      // Close and remove peer connection FIRST
      if (peersRef.current[userId]) {
        const pc = peersRef.current[userId];
        
        // Remove all event handlers to prevent memory leaks
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.oniceconnectionstatechange = null;
        
        // Close the connection
        pc.close();
        
        // Delete from ref immediately
        delete peersRef.current[userId];
        console.log('Closed and removed peer connection for', userId);
      }

      // Update state to remove user from UI immediately
      setParticipants(prev => {
        const filtered = prev.filter(p => p.id !== userId);
        console.log('Participants after removal:', filtered.map(p => p.id));
        return filtered;
      });
      
      setPeers(prev => {
        const newPeers = { ...prev };
        delete newPeers[userId];
        console.log('Peers after removal:', Object.keys(newPeers));
        return newPeers;
      });
      
      console.log('=== USER LEFT EVENT COMPLETE ===');
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

  // Recording functionality
  const startRecording = useCallback(async () => {
    try {
      // Set recording state to true first
      setIsRecording(true);
      setRecordingTime(0);

      // Request screen capture with system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 48000
        },
        systemAudio: 'include',
        surfaceSwitching: 'include',
        selfBrowserSurface: 'exclude'
      });

      console.log('Screen capture started');
      console.log('Video tracks:', displayStream.getVideoTracks().length);
      console.log('Audio tracks (system audio):', displayStream.getAudioTracks().length);

      // Mix audio: system audio + microphone
      const audioContext = new AudioContext();
      const audioDestination = audioContext.createMediaStreamDestination();

      // Add system audio from screen capture
      if (displayStream.getAudioTracks().length > 0) {
        const systemAudioSource = audioContext.createMediaStreamSource(
          new MediaStream(displayStream.getAudioTracks())
        );
        systemAudioSource.connect(audioDestination);
        console.log('System audio connected');
      }

      // Add microphone audio
      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(
          new MediaStream(localStreamRef.current.getAudioTracks())
        );
        micSource.connect(audioDestination);
        console.log('Microphone audio connected');
      }

      // Combine screen video with mixed audio
      const combinedStream = new MediaStream([
        ...displayStream.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ]);

      console.log('Combined stream tracks:', combinedStream.getTracks().length);

      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('Recording data received:', event.data.size, 'bytes');
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, total chunks:', recordedChunksRef.current.length);
        
        if (recordedChunksRef.current.length === 0) {
          console.error('No recording data available');
          alert('Recording failed: No data was captured');
          return;
        }

        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('Created blob with size:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.error('Blob is empty');
          alert('Recording failed: No data was captured');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-recording-${roomId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Revoke URL after a delay to ensure download starts
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        // Cleanup
        displayStream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };

      // Stop screen sharing when user clicks "Stop sharing" in browser
      displayStream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        if (mediaRecorderRef.current && isRecording) {
          stopRecording();
        }
      };

      mediaRecorder.start(100); // Capture data every 100ms for better reliability
      mediaRecorderRef.current = mediaRecorder;

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if (error.name === 'NotAllowedError') {
        alert('Screen recording permission denied. Please allow screen sharing to record.');
      } else if (error.name === 'NotSupportedError') {
        alert('Screen recording with system audio is not supported in your browser. Try using Chrome or Edge.');
      } else {
        alert('Failed to start recording. Please try again.');
      }
      
      setIsRecording(false);
    }
  }, [localStreamRef.current]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording, state:', mediaRecorderRef.current.state);
      
      // Request final data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        
        // Stop after a short delay to ensure final data is captured
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
          }
        }, 100);
      }
      
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      setRecordingTime(0);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Format recording time
  const formatRecordingTime = useCallback(() => {
    const hours = Math.floor(recordingTime / 3600);
    const minutes = Math.floor((recordingTime % 3600) / 60);
    const seconds = recordingTime % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [recordingTime]);

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
    isRecording,
    recordingTime,
    formatRecordingTime,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleRecording,
    sendMessage
  };

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
};
