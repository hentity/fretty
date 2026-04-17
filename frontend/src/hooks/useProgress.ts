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

import debugProgress from '../logic/debugProgress';
const DEBUG_PROGRESS = false;

export default function useProgress(user: { uid: string } | null) {
  const [progress, setProgress] = useState<Progress | null>(DEBUG_PROGRESS ? debugProgress : null);
  const [loading, setLoading] = useState(!DEBUG_PROGRESS);

  const isWeb = Capacitor.getPlatform() === 'web';
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    const fetch = async () => {
      if (DEBUG_PROGRESS) return;
      setLoading(true);

      try {
        if (isWeb && user) {
          // -------------------------------------------------------
          // Web + signed in: Firestore (with guest migration)
          // -------------------------------------------------------
          const ref = doc(db, 'progress', user.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const firestoreProgress = snap.data() as Progress;
            console.log('[progress]', JSON.stringify(firestoreProgress));
            setProgress(firestoreProgress);
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
          // Falls back to local-only if the ICloudKV plugin is unavailable
          // -------------------------------------------------------
          let iCloudProgress: Progress | null = null;
          let iCloudAvailable = false;

          try {
            const [iCloudRaw, migratedFlag, localRaw] = await Promise.all([
              ICloudKV.get({ key: ICLOUD_PROGRESS_KEY }),
              Preferences.get({ key: ICLOUD_MIGRATION_KEY }),
              Preferences.get({ key: LOCAL_STORAGE_KEY }),
            ]);
            iCloudAvailable = true;
            iCloudProgress = safeParse(iCloudRaw.value);
            const localProgress = safeParse(localRaw.value);
            console.log('[iCloud] load — iCloud:', iCloudRaw.value ? 'has data' : 'empty', '| local:', localRaw.value ? 'has data' : 'empty', '| migrated:', migratedFlag.value);

            // One-time migration: push local data to iCloud only if iCloud is empty
            if (!migratedFlag.value) {
              await Preferences.set({ key: ICLOUD_MIGRATION_KEY, value: 'true' });
              if (localProgress && !iCloudProgress) {
                console.log('[iCloud] Migrating local progress to iCloud');
                await ICloudKV.set({
                  key: ICLOUD_PROGRESS_KEY,
                  value: JSON.stringify(localProgress),
                });
              }
            }

            // Pick the best progress we have
            let resolved: Progress;
            if (iCloudProgress && localProgress) {
              resolved = mergeProgress(localProgress, iCloudProgress);
              console.log('[iCloud] Merged local + iCloud progress');
            } else if (iCloudProgress) {
              resolved = iCloudProgress;
              console.log('[iCloud] Loaded from iCloud');
              // Fresh reinstall: restore reminder preference so the tip doesn't reappear
              const reminderFlag = await Preferences.get({ key: 'practiceRemindersEnabled' });
              if (!reminderFlag.value) {
                await Preferences.set({ key: 'practiceRemindersEnabled', value: 'true' });
              }
            } else if (localProgress) {
              resolved = localProgress;
              console.log('[iCloud] Loaded from local (iCloud empty)');
            } else {
              resolved = createDefaultProgress();
              console.log('[iCloud] No progress found, created default');
            }

            setProgress(resolved);
            console.log('[progress]', JSON.stringify(resolved));
          } catch (e) {
            if (!iCloudAvailable) {
              // Native ICloudKV plugin not installed — fall back to local Preferences
              console.warn('[iCloud] Plugin unavailable, using local storage only:', e);
              const { value } = await Preferences.get({ key: LOCAL_STORAGE_KEY });
              setProgress(safeParse(value) ?? createDefaultProgress());
            } else {
              throw e;
            }
          }

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
          const webProgress = safeParse(localData) ?? createDefaultProgress();
          console.log('[progress]', JSON.stringify(webProgress));
          setProgress(webProgress);
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
      // Write to local first (always safe), then attempt iCloud
      const json = JSON.stringify(updatedProgress);
      await Preferences.set({ key: LOCAL_STORAGE_KEY, value: json });
      try {
        await ICloudKV.set({ key: ICLOUD_PROGRESS_KEY, value: json });
      } catch (e) {
        console.warn('[iCloud] Plugin unavailable, skipping iCloud write:', e);
      }
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
