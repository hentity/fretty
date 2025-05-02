import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createDefaultProgress } from '../logic/progressUtils';
import { Progress } from '../types';
import { LOCAL_STORAGE_KEY } from '../pages/Auth';

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true); // <-- start loading

      if (user) {
        const ref = doc(db, 'progress', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProgress(snap.data() as Progress);
        } else {
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localData) {
            try {
              const guestProgress = JSON.parse(localData) as Progress;
              await setDoc(ref, guestProgress);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              setProgress(guestProgress);
            } catch {
              const defaultProgress = createDefaultProgress();
              await setDoc(ref, defaultProgress);
              setProgress(defaultProgress);
            }
          } else {
            const defaultProgress = createDefaultProgress();
            await setDoc(ref, defaultProgress);
            setProgress(defaultProgress);
          }
        }
      } else {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
          try {
            setProgress(JSON.parse(localData) as Progress);
          } catch {
            setProgress(createDefaultProgress());
          }
        } else {
          setProgress(createDefaultProgress());
        }
      }

      setLoading(false); // <-- done loading
    };

    fetch();
  }, [user]);

  const saveProgress = async (updatedProgress: Progress | null) => {
    if (!updatedProgress) return;

    if (user) {
      const ref = doc(db, 'progress', user.uid);
      await setDoc(ref, updatedProgress);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProgress));
    }

    setProgress(updatedProgress);
  };

  return { progress, setProgress, saveProgress, loading };
}

