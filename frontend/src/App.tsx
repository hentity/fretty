import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Help from './pages/Help'
import Nav from './components/Nav'

function App() {
  return (
    <div style={{ padding: 20 }}>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </div>
  )
}

export default App
