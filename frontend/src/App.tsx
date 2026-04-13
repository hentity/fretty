import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LessonProvider } from './context/LessonProvider';
import { IntroTourProvider } from './context/IntroTourProvider';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Help from './pages/Help';
import Nav from './components/Nav';
import Tilt from './components/Tilt';
import AuthGate from './components/AuthGate';
import Options from './pages/Options';
import SoundTest from './pages/SoundTest';
import ProfileTest from './pages/ProfileTest';
import ButtonTest from './pages/ButtonTest';

function App() {
  useEffect(() => {
    const setViewportHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    return () => window.removeEventListener('resize', setViewportHeight);
  }, []);

  return (
    <div
      className="w-screen flex flex-col bg-bg overflow-hidden"
      style={{ height: 'calc(var(--vh) * 100)' }}
    >
      <AuthGate>
        <LessonProvider>
          <IntroTourProvider>
          <Tilt />
          <Nav />
          <div className="flex-grow flex">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<Help />} />
              <Route path="/options" element={<Options />} />
              <Route path="/sound-test" element={<SoundTest />} />
              <Route path="/profile-test" element={<ProfileTest />} />
              <Route path="/button-test" element={<ButtonTest />} />
            </Routes>
          </div>
          </IntroTourProvider>
        </LessonProvider>
      </AuthGate>
    </div>
  );
}

export default App;
