import { useState, useEffect } from 'react'
import { auth, provider, db } from '../firebase'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Progress, Spot } from '../types'
import { spotToNote } from '../logic/noteUtils'
import { useAuth } from '../context/UserContext'

export function createDefaultProgress(): Progress {
  const tuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

  const spots: Spot[] = []
  for (let string = 0; string < 6; string++) {
    for (let fret = 0; fret < 12; fret++) {
      const { note, octave } = spotToNote(string, fret, tuning)
      let status: Spot['status'] = "unseen"
      if (note.length > 1) { status = "unlearnable" }
      spots.push({
        status: status,
        interval: 1,
        ease_factor: 1.6,
        good_attempts: 0,
        string,
        fret,
        note,
        octave,
      })
    }
  }

  return {
    new: true,
    tuning,
    last_review_date: null,
    review_date_to_spots: {},
    spot_to_review_date: {},
    spots
  }
}

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
