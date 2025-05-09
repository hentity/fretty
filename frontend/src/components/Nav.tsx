import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/UserContext';
import { TextBox } from '../components/TextBox';
import { interpolateColor, makeTextBlock } from '../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../types';
import { useLesson } from '../context/LessonContext';
import { LEARNING_GOOD_ATTEMPTS, MASTERED_THRESHOLD, spotKey } from '../logic/lessonUtils';

async function logoutAndRedirect(navigate: ReturnType<typeof useNavigate>) {
  try {
    await signOut(auth);
    console.log('User signed out successfully.');
    navigate('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
}



function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user } = useAuth();
  const {
    completedSpots,
    lessonQueue,
    currentSpot,
    progress,
    loading,
    today,
  } = useLesson();

  const [leftContent, setLeftContent] = useState<ColoredChunk[]>([]);
  const [middleContent, setMiddleContent] = useState<ColoredChunk[]>([]);
  const [rightContent, setRightContent] = useState<ColoredChunk[]>([]);
  const [progressFraction, setProgressFraction] = useState(0);

  useEffect(() => {
    // --------------------------------
    // Skip logic until loading is done
    // --------------------------------
    if (loading || !progress) return;

    // ----------------------------
    // Calculate left content
    // ----------------------------
    if (currentPath === '/') {
      setLeftContent(makeTextBlock([
        user
          ? { text: '[ progress ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/profile') }
          : { text: '[ sign in ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/auth') }
      ]));
    } else {
      setLeftContent(makeTextBlock([
        { text: '[ home ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/') }
      ]));
    }

    // ----------------------------
    // Calculate progress stats
    // ----------------------------
    if (progress.last_review_date == today) {
      setProgressFraction(1)
    } else {
      const rawSpots = [
        ...completedSpots,
        ...(lessonQueue || []),
        ...(currentSpot ? [currentSpot] : [])
      ];
  
      const spotMap = new Map<string, typeof rawSpots[number]>();
      for (const spot of rawSpots) {
        spotMap.set(spotKey(spot), spot);
      }
  
      const allSpots = Array.from(spotMap.values());
      const totalSpots = allSpots.length;
      const totalGoodAttempts = allSpots.reduce(
        (sum, spot) => sum + (spot.good_attempts || 0),
        0
      );
      const maxGoodAttempts = totalSpots * LEARNING_GOOD_ATTEMPTS;
      const fraction = maxGoodAttempts > 0 ? totalGoodAttempts / maxGoodAttempts : 0;
      setProgressFraction(Math.min(fraction, 1));
    }

    // ----------------------------
    // Middle content (progress bar stats)
    // ----------------------------
    let practicing = 0, mastered = 0, unpracticed = 0;

    progress.spots.forEach((spot) => {
      if (spot.status === 'unlearnable') return;
      if (spot.interval >= MASTERED_THRESHOLD) mastered++;
      else if (spot.num_practices > 0) practicing++;
      else unpracticed++;
    });

    setMiddleContent(makeTextBlock([
      { text: '{ ', className: 'text-fg bg-bg font-bold' },
      { text: `${practicing} `, className: 'text-practiced bg-bg font-bold' },
      { text: 'learning   ', className: 'text-fg bg-bg' },
      { text: `${mastered} `, className: 'text-mastered bg-bg font-bold' },
      { text: 'mastered   ', className: 'text-fg bg-bg' },
      { text: `${unpracticed} `, className: 'text-fg brightness-60 font-bold' },
      { text: 'unpracticed', className: 'text-fg bg-bg' },
      { text: ' }', className: 'text-fg bg-bg font-bold' },
    ]));

    // ----------------------------
    // Right content
    // ----------------------------
    if (currentPath === '/profile') {
      setRightContent(makeTextBlock([
        { text: '[ sign out ]', className: 'text-fg font-bold active:text-bg active:bg-fg hover:text-bg hover:bg-fg transition', onClick: () => logoutAndRedirect(navigate) }
      ]));
    } else if (currentPath === '/help') {
      setRightContent(makeTextBlock([
        { text: '[ home ]', className: 'text-fg active:text-bg active:bg-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/') }
      ]));
    } else {
      setRightContent(makeTextBlock([
        { text: '[ about ]', className: 'text-fg active:text-bg active:bg-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/about') }
      ]));
    }
  }, [user, progress, completedSpots, lessonQueue, currentSpot, navigate, currentPath, loading]);

  if (loading) return null;

  return (
    <div className="relative w-screen overflow-x-hidden select-none py-2 lg:py-6">
      {/* Background progress bar */}
      {!loading && (
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-300 brightness-70 z-0"
          style={{
            width: `${progressFraction * 100}%`,
            backgroundColor: interpolateColor(progressFraction),
          }}
        />
      )}

      {/* Foreground nav content */}
      <div className="relative flex justify-between items-center w-full px-4 h-full z-10">
        <TextBox width={12} height={1} content={leftContent} />
        {!loading && <TextBox width={45} height={1} content={middleContent} />}
        <TextBox width={12} height={1} content={rightContent} />
      </div>
    </div>
  );
}

export default Nav;
