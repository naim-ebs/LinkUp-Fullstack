import { SocketProvider } from './context/SocketContext';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import JoinRoom from './components/JoinRoom';
import MeetingRoom from './pages/MeetingRoom';
import CertificateHelper from './components/CertificateHelper';

const AppContent = () => {
  const { isInRoom } = useMeeting();
  return isInRoom ? <MeetingRoom /> : <JoinRoom />;
};

function App() {
  return (
    <SocketProvider>
      <MeetingProvider>
        <CertificateHelper>
          <AppContent />
        </CertificateHelper>
      </MeetingProvider>
    </SocketProvider>
  );
}

export default App;
