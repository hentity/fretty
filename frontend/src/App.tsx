import { Routes, Route } from 'react-router-dom'
import { LessonProvider } from './context/LessonProvider'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Help from './pages/Help'
import Nav from './components/Nav'
import TextTest from './pages/TextTest'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <LessonProvider>
        <Nav className="h-16 bg-gray-800 text-white flex items-center px-4"/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/help" element={<Help />} />
          <Route path="/textTest" element={<TextTest />} />
        </Routes>
      </LessonProvider>
    </div>
  )
}

export default App
