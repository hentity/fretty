import NotePanelBefore from './NotePanelBefore';
import IntroText from './IntroText';
import { useAuth } from '../../context/UserContext';
import { useLesson } from '../../context/LessonContext';
import { LOCAL_STORAGE_KEY } from '../../pages/Auth';
import { TextBox } from '../TextBox';
import LessonPanelAfter from '../after/LessonPanelAfter';
import { useEffect, useState } from 'react';

function hasLocalProgress(): boolean {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw).spots?.length > 0 : false;
  } catch {
    return false;
  }
}

export default function Before() {
  const { user } = useAuth();
  const { progress, today, loading } = useLesson();
  const [mounted, setMounted] = useState(false);

    useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading || !progress) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <TextBox width={30} height={3} content={[{ text: '', className: 'text-fg' }]} />
      </div>
    );
  }

  const showIntro = !user && !hasLocalProgress();
  const showComplete = progress.last_review_date === today;

  return (
    <div className="flex flex-col justify-between w-full h-full">
      {showIntro && <IntroText />}
      {showComplete && <LessonPanelAfter />}
      {!showComplete && <NotePanelBefore />}
    </div>
  );
}
