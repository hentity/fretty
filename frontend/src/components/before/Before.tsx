import NotePanelBefore from './NotePanelBefore';
import IntroText from './IntroText';
import { useAuth } from '../../context/UserContext';
import { useLesson } from '../../context/LessonContext';
import { LOCAL_STORAGE_KEY } from '../../pages/Auth';
import LessonCompleteText from './LessonComplete';
import { TextBox } from '../TextBox';

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

  if (loading || !progress) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <TextBox width={30} height={3} content={[{ text: 'Loading progress...', className: 'text-fg' }]} />
      </div>
    );
  }

  const showIntro = !user && !hasLocalProgress();
  const showComplete = progress.last_review_date === today;

  return (
    <div className="flex flex-col justify-between w-full h-full">
      {showIntro && <IntroText />}
      {showComplete && <LessonCompleteText />}
      {!showComplete && <NotePanelBefore />}
    </div>
  );
}
