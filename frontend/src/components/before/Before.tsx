import { useAuth } from '../../context/UserContext';
import { useLesson } from '../../context/LessonContext';
import { LOCAL_STORAGE_KEY } from '../../pages/Auth';
import { TextBox } from '../TextBox';
import LessonPanelAfter from '../after/LessonPanelAfter';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

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

export default function Before() {
  const { user } = useAuth();
  const { progress, loading } = useLesson();

  const [mounted, setMounted] = useState(false);
  const [hasProgress, setHasProgress] = useState(true);

  useEffect(() => {
    const checkConditions = async () => {
      setMounted(true);
      const progressExists = await hasLocalProgress();
      setHasProgress(progressExists);

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

  return (
    <div className="flex flex-col w-full h-full">
      <LessonPanelAfter showIntro={showIntro} />
    </div>
  );
}
