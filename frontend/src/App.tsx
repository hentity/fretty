import { Routes, Route } from 'react-router-dom';
import { LessonProvider } from './context/LessonProvider';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Help from './pages/Help';
import Nav from './components/Nav';
import Profile from './pages/Profile';
import Tilt from './components/Tilt';
import AuthGate from './components/AuthGate';

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-bg">
      <AuthGate>
        <LessonProvider>
          <Tilt />
          <Nav />
          <div className="flex-grow flex">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/about" element={<Help />} />
            </Routes>
          </div>
        </LessonProvider>
      </AuthGate>
    </div>
  );
}

export default App;
