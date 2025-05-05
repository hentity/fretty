import { useEffect } from 'react';
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
