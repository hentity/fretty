import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createDefaultProgress } from '../logic/progressUtils';
import { Progress } from '../types';
import { LOCAL_STORAGE_KEY } from '../pages/Auth';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      try {
        if (isWeb && user) {
          // firestore for logged-in web user
          const ref = doc(db, 'progress', user.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setProgress(snap.data() as Progress);
          } else {
            // attempt to migrate guest localStorage progress if it exists
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
        } else if (!isWeb) {
          // preferences for native app
          const { value } = await Preferences.get({ key: LOCAL_STORAGE_KEY });
          if (value) {
            try {
              setProgress(JSON.parse(value) as Progress);
            } catch {
              setProgress(createDefaultProgress());
            }
          } else {
            setProgress(createDefaultProgress());
          }
        } else {
          // localStorage for guest web user
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
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user, isWeb]);

  const saveProgress = async (updatedProgress: Progress | null) => {
    if (!updatedProgress) return;

    if (isWeb && user) {
      // firestore for logged-in web user
      const ref = doc(db, 'progress', user.uid);
      await setDoc(ref, updatedProgress);
    } else if (!isWeb) {
      // preferences for native app
      await Preferences.set({
        key: LOCAL_STORAGE_KEY,
        value: JSON.stringify(updatedProgress),
      });
    } else {
      // localStorage for guest web user
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProgress));
    }

    setProgress(updatedProgress);
  };

  return { progress, setProgress, saveProgress, loading };
}
