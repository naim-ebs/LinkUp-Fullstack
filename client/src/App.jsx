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
  const serverUrl = import.meta.env.VITE_SERVER_URL;

  return (
    <SocketProvider serverUrl={serverUrl}>
      <MeetingProvider>
        <CertificateHelper>
          <AppContent />
        </CertificateHelper>
      </MeetingProvider>
    </SocketProvider>
  );
}

export default App;
