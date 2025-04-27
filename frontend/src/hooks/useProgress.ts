import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createDefaultProgress } from '../logic/progressUtils';
import { Progress } from '../types';

const LOCAL_STORAGE_KEY = 'fretty_guest_progress';

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (user) {
        // User logged in -> try to fetch from Firestore
        const ref = doc(db, 'progress', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProgress(snap.data() as Progress);
        } else {
          // No progress -> try to migrate guest progress
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            try {
              const guestProgress = JSON.parse(localData) as Progress;
              console.log('Uploading guest progress to Firestore:', guestProgress);
              await setDoc(ref, guestProgress);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              setProgress(guestProgress);
            } catch (err) {
              console.error('Failed to parse guest progress. Falling back to default.', err);
              const defaultProgress = createDefaultProgress();
              await setDoc(ref, defaultProgress);
              setProgress(defaultProgress);
            }
          } else {
            // No guest progress -> create default
            console.log('No guest progress found. Creating default progress.');
            const defaultProgress = createDefaultProgress();
            await setDoc(ref, defaultProgress);
            setProgress(defaultProgress);
          }
        }
      } else {
        // No user -> try to fetch guest progress from localStorage
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          try {
            setProgress(JSON.parse(localData) as Progress);
          } catch (err) {
            console.error('Failed to parse guest progress from localStorage.', err);
            setProgress(createDefaultProgress()); // fallback to fresh blank guest progress
          }
        } else {
          // No guest progress -> create default
          setProgress(createDefaultProgress());
        }
      }
    };

    fetch();
  }, [user]);

  const saveProgress = async (updatedProgress: Progress | null) => {
    if (!updatedProgress) return;

    if (user) {
      // Save to Firestore
      const ref = doc(db, 'progress', user.uid);
      await setDoc(ref, updatedProgress);
    } else {
      // Save guest progress to localStorage
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProgress));
      } catch (err) {
        console.error('Failed to save guest progress to localStorage.', err);
      }
    }

    setProgress(updatedProgress);
  };

  return { progress, setProgress, saveProgress };
}
