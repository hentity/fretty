import NotePanelBefore from './NotePanelBefore';
import IntroText from './IntroText';
import Tips from './Tips';
import { useAuth } from '../../context/UserContext';
import { useLesson } from '../../context/LessonContext';
import { LOCAL_STORAGE_KEY } from '../../pages/Auth';
import { TextBox } from '../TextBox';
import LessonPanelAfter from '../after/LessonPanelAfter';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

async function hasLocalProgress(): Promise<boolean> {
  const isWeb = Capacitor.getPlatform() === 'web';

  try {
    if (isWeb) {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw).spots?.length > 0 : false;
    } else {
      const { value } = await Preferences.get({ key: LOCAL_STORAGE_KEY });
      return value ? JSON.parse(value).spots?.length > 0 : false;
    }
  } catch {
    return false;
  }
}

const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';

export default function Before() {
  const { user } = useAuth();
  const { progress, today, loading } = useLesson();

  const [mounted, setMounted] = useState(false);
  const [hasProgress, setHasProgress] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);

  useEffect(() => {
    const checkConditions = async () => {
      setMounted(true);
      const progressExists = await hasLocalProgress();
      setHasProgress(progressExists);

      const isWeb = Capacitor.getPlatform() === 'web';
      if (isWeb) return;

      // If reminders pref is not set, ask for permission
      const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });

      if (value !== null) {
        // Already asked → do nothing
        return;
      }

      // Ask for permissions once
      const { display } = await LocalNotifications.requestPermissions();

      if (display === 'granted') {
        await Preferences.set({ key: REMINDERS_PREF_KEY, value: 'true' });
      } else {
        await Preferences.set({ key: REMINDERS_PREF_KEY, value: 'false' });
      }
    };

  checkConditions();
}, []);

  if (!mounted || loading || !progress) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <TextBox width={30} height={3} content={[{ text: '', className: 'text-fg' }]} />
      </div>
    );
  }

  const showIntro = !user && !hasProgress;
  const showComplete = progress.last_review_date === today;

  const showIntroText = showIntro && !isPreviewing;

  return (
    <div className="flex flex-col w-full h-full">
      {showComplete && <LessonPanelAfter />}
      {!showComplete && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-6">
          {showIntroText && <IntroText />}
          <NotePanelBefore onPreviewChange={setIsPreviewing} />
          {!showIntro && !isPreviewing && <Tips />}
        </div>
      )}
    </div>
  );
}
