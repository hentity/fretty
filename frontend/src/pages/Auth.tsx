import { useState, useEffect } from 'react'
import { auth, provider, db } from '../firebase'
import { createDefaultProgress }  from '../logic/progressUtils'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '../context/UserContext'

async function createProgressIfMissing(uid: string) {
  const ref = doc(db, 'progress', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const defaultProgress = createDefaultProgress()
    console.log(defaultProgress)
    await setDoc(ref, defaultProgress)
  } else {
    console.log(snap)
  }
}

function Auth() {
  // Removed useEffect and centralised user context retrieval from userContext.tsx 
  const user = useAuth().user

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      await createProgressIfMissing(user.uid)
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
