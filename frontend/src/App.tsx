import { useEffect, useState } from 'react'
import init, { greet } from './wasm/audio_processing'
import { auth, provider, db } from './firebase'
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
      }
    })

    load()
    return () => unsub()
  }, [])

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

      {user ? (
        <>
          <p>Welcome, {user.displayName}</p>
          <button onClick={logout}>Log out</button>

          <div style={{ marginTop: 20 }}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write something..."
            />
            <button onClick={saveNote}>Save</button>
          </div>

          {savedNote && (
            <p style={{ marginTop: 10 }}>
              Last saved note: <strong>{savedNote}</strong>
            </p>
          )}
        </>
      ) : (
        <button onClick={login}>Sign in with Google</button>
      )}
    </div>
  )
}

export default App
