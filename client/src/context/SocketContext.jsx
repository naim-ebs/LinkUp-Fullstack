import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, serverUrl }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Determine the backend URL based on current hostname
    let backendUrl = serverUrl;
    
    if (!backendUrl) {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port;
      
      // Development environment (localhost, 127.0.0.1, or local IP addresses)
      if (hostname === 'localhost' || hostname === '127.0.0.1' || 
          hostname.match(/^192\.168\./) || hostname.match(/^10\./) || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
          port === '5173' || port === '3000') {
        // Use same protocol as frontend (http/https) and port 3000 for backend
        const useHttps = protocol === 'https:';
        backendUrl = `${useHttps ? 'https' : 'http'}://${hostname}:3000`;
      } 
      // Production environment - backend on same domain with Apache proxy
      else {
        // In production with Apache proxy, use same origin
        backendUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
      }
    }
    
    console.log('Connecting to backend:', backendUrl);
    
    const newSocket = io(backendUrl, {
      auth: {
        token: 'dummy-token' // Add real auth token here
      },
      // Allow self-signed certificates in development
      transports: ['websocket', 'polling'],
      secure: true,
      rejectUnauthorized: false // Accept self-signed certificates (development only)
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
