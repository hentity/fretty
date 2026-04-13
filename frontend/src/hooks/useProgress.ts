import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createDefaultProgress } from '../logic/progressUtils';
import { Progress } from '../types';
import { LOCAL_STORAGE_KEY } from '../pages/Auth';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { ICloudKV } from '../plugins/ICloudKV';

const ICLOUD_PROGRESS_KEY = 'fretty_progress';
const ICLOUD_MIGRATION_KEY = 'fretty_icloud_migrated';

// Merge strategy: prefer whichever has the more recent last_review_date.
// Tie-break on total num_practices (more = further along).
function mergeProgress(a: Progress, b: Progress): Progress {
  const dateA = a.last_review_date ?? '0000-00-00';
  const dateB = b.last_review_date ?? '0000-00-00';
  if (dateB > dateA) return b;
  if (dateA > dateB) return a;
  const practicesA = a.spots.reduce((sum, s) => sum + s.num_practices, 0);
  const practicesB = b.spots.reduce((sum, s) => sum + s.num_practices, 0);
  return practicesB > practicesA ? b : a;
}

function safeParse(value: string | null | undefined): Progress | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Progress;
  } catch {
    return null;
  }
}

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  const isWeb = Capacitor.getPlatform() === 'web';
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      try {
        if (isWeb && user) {
          // -------------------------------------------------------
          // Web + signed in: Firestore (with guest migration)
          // -------------------------------------------------------
          const ref = doc(db, 'progress', user.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            setProgress(snap.data() as Progress);
          } else {
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            const guestProgress = safeParse(localData);
            if (guestProgress) {
              await setDoc(ref, guestProgress);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              setProgress(guestProgress);
            } else {
              const defaultProgress = createDefaultProgress();
              await setDoc(ref, defaultProgress);
              setProgress(defaultProgress);
            }
          }

        } else if (isIOS) {
          // -------------------------------------------------------
          // iOS native: iCloud KV + local Preferences
          // Read both, merge, then migrate local → iCloud if needed
          // -------------------------------------------------------
          const [iCloudRaw, localRaw, migratedFlag] = await Promise.all([
            ICloudKV.get({ key: ICLOUD_PROGRESS_KEY }),
            Preferences.get({ key: LOCAL_STORAGE_KEY }),
            Preferences.get({ key: ICLOUD_MIGRATION_KEY }),
          ]);

          const iCloudProgress = safeParse(iCloudRaw.value);
          const localProgress = safeParse(localRaw.value);

          // One-time migration: push existing local data up to iCloud
          if (!migratedFlag.value && localProgress) {
            console.log('[iCloud] Migrating local progress to iCloud');
            await ICloudKV.set({
              key: ICLOUD_PROGRESS_KEY,
              value: JSON.stringify(localProgress),
            });
            await Preferences.set({ key: ICLOUD_MIGRATION_KEY, value: 'true' });
          }

          // Pick the best progress we have
          let resolved: Progress;
          if (iCloudProgress && localProgress) {
            resolved = mergeProgress(localProgress, iCloudProgress);
            console.log('[iCloud] Merged local + iCloud progress');
          } else if (iCloudProgress) {
            resolved = iCloudProgress;
            console.log('[iCloud] Loaded from iCloud');
          } else if (localProgress) {
            resolved = localProgress;
            console.log('[iCloud] Loaded from local (iCloud empty)');
          } else {
            resolved = createDefaultProgress();
            console.log('[iCloud] No progress found, created default');
          }

          setProgress(resolved);

        } else if (!isWeb) {
          // -------------------------------------------------------
          // Android (and other non-web): local Preferences only
          // -------------------------------------------------------
          const { value } = await Preferences.get({ key: LOCAL_STORAGE_KEY });
          setProgress(safeParse(value) ?? createDefaultProgress());

        } else {
          // -------------------------------------------------------
          // Web guest: localStorage
          // -------------------------------------------------------
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
          setProgress(safeParse(localData) ?? createDefaultProgress());
        }

      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user, isWeb, isIOS]);

  const saveProgress = async (updatedProgress: Progress | null) => {
    if (!updatedProgress) return;

    if (isWeb && user) {
      const ref = doc(db, 'progress', user.uid);
      await setDoc(ref, updatedProgress);
    } else if (isIOS) {
      // Write to both so local is always a valid fallback
      const json = JSON.stringify(updatedProgress);
      await Promise.all([
        Preferences.set({ key: LOCAL_STORAGE_KEY, value: json }),
        ICloudKV.set({ key: ICLOUD_PROGRESS_KEY, value: json }),
      ]);
    } else if (!isWeb) {
      await Preferences.set({
        key: LOCAL_STORAGE_KEY,
        value: JSON.stringify(updatedProgress),
      });
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProgress));
    }

    setProgress(updatedProgress);
  };

  return { progress, setProgress, saveProgress, loading };
}
