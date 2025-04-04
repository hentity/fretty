import { useEffect, useState } from 'react'
import init, { greet } from './wasm/audio_processing'
import { auth, provider, db } from './firebase'
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore'

function App() {
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      await init()
      setMessage(greet('Henry'))
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          setSavedNote(userDoc.data().note ?? '')
        }
        navigate('/home')
      } else {
        navigate('/')
      }
    })

    load()
    return () => unsub()
  }, [navigate])

  const login = () => {
    signInWithPopup(auth, provider).catch((err) => {
      console.error('Login error:', err.message)
    })
  }

  const logout = () => signOut(auth)

  const saveNote = async () => {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid), {
        note: note
      })
      setSavedNote(note)
      setNote('')
    } catch (err) {
      console.error('Error saving note:', err)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Vite + Rust + WASM + Firebase</h1>
      <p>{message}</p>

      <Routes>
        <Route path="/" element={<LandingPage login={login} />} />
        <Route
          path="/home"
          element={
            user ? (
              <HomePage user={user} note={note} savedNote={savedNote} logout={logout} setNote={setNote} saveNote={saveNote}/>
            ) : (
              <p>Loading...</p>
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
