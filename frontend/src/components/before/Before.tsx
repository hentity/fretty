import NotePanelBefore from './NotePanelBefore'
import IntroText from './IntroText'
import { useAuth } from '../../context/UserContext'
import { LOCAL_STORAGE_KEY } from '../../pages/Auth';

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
  const showIntro = !user && !hasLocalProgress();

  return (
    <>
      <div className="flex flex-col justify-between">
        {showIntro && <IntroText />}
        <NotePanelBefore />
      </div>
    </>
  );
}
