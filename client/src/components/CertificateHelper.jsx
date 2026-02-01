import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const CertificateHelper = ({ children }) => {
  const { isConnected } = useSocket();
  const [showHelper, setShowHelper] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    // Determine backend URL
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    let url = '';
    if (hostname === 'localhost' || hostname === '127.0.0.1' || 
        hostname.match(/^192\.168\./) || hostname.match(/^10\./) || 
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
        port === '5173' || port === '3000') {
      const useHttps = protocol === 'https:';
      url = `${useHttps ? 'https' : 'http'}://${hostname}:3000`;
    }
    
    setBackendUrl(url);

    // Show helper after 3 seconds if not connected
    const timer = setTimeout(() => {
      if (!isConnected && url.startsWith('https')) {
        setShowHelper(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      setShowHelper(false);
    }
  }, [isConnected]);

  if (!showHelper) {
    return children;
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            SSL Certificate Required
          </h2>
          <p className="text-slate-600 mb-6">
            To connect securely, you need to accept the self-signed SSL certificate for the backend server.
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-3">Follow these steps:</h3>
          <ol className="space-y-3 text-slate-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              <span>Click the button below to open the backend server in a new tab</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              <span>You'll see a security warning - click <strong>"Advanced"</strong> or <strong>"Show Details"</strong></span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              <span>Click <strong>"Proceed to {window.location.hostname} (unsafe)"</strong> or <strong>"Accept the Risk"</strong></span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              <span>Close that tab and return here - the connection will work automatically</span>
            </li>
          </ol>
        </div>

        <div className="flex gap-4">
          <a
            href={backendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Open Backend Server ({backendUrl})
          </a>
          <button
            onClick={() => setShowHelper(false)}
            className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            I've Already Done This
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-4 text-center">
          This is a self-signed certificate for development only. In production, we'll use Let's Encrypt.
        </p>
      </div>
    </div>
  );
};

export default CertificateHelper;
