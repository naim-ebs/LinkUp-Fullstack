import { useState } from 'react';
import { Video, Link2, ArrowRight, Sparkles, Users, Shield, Zap, MessageSquare } from 'lucide-react';
import { useMeeting } from '../context/MeetingContext';

const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { joinRoom } = useMeeting();

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setRoomId(id);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomId.trim() || !name.trim()) return;

    setIsJoining(true);
    try {
      await joinRoom(roomId.trim(), name.trim());
    } catch (error) {
      console.error('Error joining room:', error);
      alert(error.message || 'Failed to access camera/microphone. Please check permissions.');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left Side - Form */}
          <div className="relative z-10 max-w-lg mx-auto lg:mx-0">
            {/* Logo/Brand */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8 animate-float">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-2xl flex items-center justify-center">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                    LinkUp
                  </h1>
                  <p className='text-xs pl-0.5 text-gray-500'>
                    Powered by 
                    <span>
                      <a  href="https://ebsbd.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium inline-flex items-center gap-1 group ml-1">
                         EBS
                      </a>
                    </span>
                  </p>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                Start your meeting
              </h2>
              <p className="text-gray-400 text-base">
                Connect, collaborate, and communicate seamlessly with real-time.
              </p>
            </div>

            {/* Join Interface - No traditional form look */}
            <form onSubmit={handleJoin} className="space-y-6">
              {/* Name Input - Inline style */}
              <div className="group">
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-dark-800/40 to-dark-800/20 rounded-2xl border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="name" className="text-xs text-gray-500 uppercase tracking-wider font-medium block mb-1">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-transparent border-0 text-white text-lg placeholder-gray-600 focus:outline-none p-0"
                      required
                      disabled={isJoining}
                    />
                  </div>
                </div>
              </div>

              {/* Room ID Input - Inline style */}
              <div className="group">
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-dark-800/40 to-dark-800/20 rounded-2xl border border-dark-700/50 hover:border-primary-500/50 transition-all duration-300 backdrop-blur-sm">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="roomId" className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        Room ID
                      </label>
                      <button
                        type="button"
                        onClick={generateRoomId}
                        className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors font-medium cursor-pointer"
                        disabled={isJoining}
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </button>
                    </div>
                    <input
                      id="roomId"
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter or generate room ID"
                      className="w-full bg-transparent border-0 text-white text-lg placeholder-gray-600 focus:outline-none p-0"
                      required
                      disabled={isJoining}
                    />
                  </div>
                </div>
              </div>

              {/* Join Button - Modern style */}
              <button
                type="submit"
                disabled={!roomId.trim() || !name.trim() || isJoining}
                className="group relative w-full py-5 px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-2xl text-white text-lg font-semibold shadow-2xl shadow-primary-600/30 hover:shadow-primary-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="relative flex items-center justify-center gap-3">
                  {isJoining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Joining meeting...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Meeting</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>

              {/* Security Notice */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-6 h-6 rounded-lg bg-green-600/10 flex items-center justify-center">
                    <span className="text-sm">🔒</span>
                  </div>
                  <span>End-to-end encrypted</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <div className="text-xs text-gray-500">Camera & mic required</div>
              </div>
            </form>

            {/* Creator Credit */}
            <div className="mt-10 pt-6 border-t border-dark-800/50">
              <p className="text-sm text-gray-500">
                Developed by{' '}
                <a
                  href="https://naimsiddiqui.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors font-medium inline-flex items-center gap-1 group"
                >
                  Naim Siddiqui
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </p>
            </div>
          </div>

          {/* Right Side - Animated Elements */}
          <div className="hidden lg:block relative h-[600px]">
            {/* Floating gradient orbs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '0.5s' }} />

            {/* Floating feature cards */}
            <div className="absolute top-12 left-12 animate-float-delayed">
              <div className="card p-6 backdrop-blur-xl bg-dark-900/60 shadow-2xl max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <Video className="w-5 h-5 text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-white">HD Video</h3>
                </div>
                <p className="text-sm text-gray-400">Crystal clear video quality for professional meetings</p>
              </div>
            </div>

            <div className="absolute top-48 right-8 animate-float" style={{ animationDelay: '0.3s' }}>
              <div className="card p-6 backdrop-blur-xl bg-dark-900/60 shadow-2xl max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white">Multi-User</h3>
                </div>
                <p className="text-sm text-gray-400">Connect with multiple participants simultaneously</p>
              </div>
            </div>

            <div className="absolute bottom-32 left-20 animate-float-delayed" style={{ animationDelay: '0.6s' }}>
              <div className="card p-6 backdrop-blur-xl bg-dark-900/60 shadow-2xl max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white">Screen Share</h3>
                </div>
                <p className="text-sm text-gray-400">Share your screen with just one click</p>
              </div>
            </div>

            <div className="absolute bottom-12 right-16 animate-float" style={{ animationDelay: '0.9s' }}>
              <div className="card p-6 backdrop-blur-xl bg-dark-900/60 shadow-2xl max-w-[240px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Live Chat</h3>
                </div>
                <p className="text-sm text-gray-400">Real-time messaging during your meetings</p>
              </div>
            </div>

            {/* Animated connecting lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: -1 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <path
                d="M 100 80 Q 200 150, 450 250"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse-slow"
              />
              <path
                d="M 150 350 Q 300 400, 420 320"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse-slow"
                style={{ animationDelay: '0.5s' }}
              />
              <path
                d="M 500 100 Q 400 250, 200 450"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-pulse-slow"
                style={{ animationDelay: '1s' }}
              />
            </svg>

            {/* Floating particles */}
            <div className="absolute top-24 right-32 w-2 h-2 bg-primary-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="absolute top-64 left-48 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.7s' }} />
            <div className="absolute bottom-48 right-24 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1.2s' }} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
