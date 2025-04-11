import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { Progress } from '../types'

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const ref = doc(db, 'progress', user.uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setProgress(snap.data() as Progress)
      }
    }
    fetch()
  }, [user])

  const saveProgress = async (updatedProgress: Progress | null) => {
    if (!user || !updatedProgress) return
    const ref = doc(db, 'progress', user.uid)
    await setDoc(ref, updatedProgress)
    setProgress(updatedProgress)
  }

  return { progress, setProgress, saveProgress }
}