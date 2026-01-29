import { SocketProvider } from './context/SocketContext';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import JoinRoom from './components/JoinRoom';
import MeetingRoom from './pages/MeetingRoom';

const AppContent = () => {
  const { isInRoom } = useMeeting();
  return isInRoom ? <MeetingRoom /> : <JoinRoom />;
};

function App() {
  return (
    <SocketProvider>
      <MeetingProvider>
        <AppContent />
      </MeetingProvider>
    </SocketProvider>
  );
}

export default App;
