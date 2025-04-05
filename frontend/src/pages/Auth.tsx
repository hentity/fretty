import { useState, useEffect } from 'react'
import { auth, provider } from '../firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'

function Auth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const login = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  const logout = () => {
    signOut(auth)
  }

  return (
    <div>
      <h2>Auth Page</h2>
      {user ? (
        <>
          <p>Signed in as: {user.email}</p>
          <button onClick={logout}>Sign out</button>
        </>
      ) : (
        <>
          <p>No user signed in</p>
          <button onClick={login}>Sign in with Google</button>
        </>
      )}
    </div>
  )
}

export default Auth
