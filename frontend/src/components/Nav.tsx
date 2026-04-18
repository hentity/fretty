import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { auth } from '../firebase';
import { useAuth } from '../context/UserContext';
import { TextBox } from '../components/TextBox';
import { interpolateColor, makeTextBlock } from '../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../types';
import { useLesson } from '../context/LessonContext';
import { useIntroTour } from '../context/IntroTourContext';
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
    lessonStatus,
    loading,
    today,
    isFirstLesson,
    tutorialStep,
    isPracticeAgain,
  } = useLesson();
  const { isIntroActive, introStep } = useIntroTour();

  const [leftContent, setLeftContent] = useState<ColoredChunk[]>([]);
  const [middleContent, setMiddleContent] = useState<ColoredChunk[]>([]);
  const [rightContent, setRightContent] = useState<ColoredChunk[]>([]);
  const [progressFraction, setProgressFraction] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showTutorialProgress, setShowTutorialProgress] = useState(false);
  const [compactCounts, setCompactCounts] = useState<{practicing: number, mastered: number, unpracticed: number} | null>(null);

  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    // --------------------------------
    // Skip logic until loading is done
    // --------------------------------
    if (loading || !progress) return;

    // ----------------------------
    // Calculate left content
    // ----------------------------
    if (!isWeb) {
      if (currentPath === '/about') {
        setLeftContent([{text: '[ back ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/')}])
      } else {
        setLeftContent([{text: '[ about ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/about')}])
      }
    } else if (currentPath === '/' || currentPath === '/options') {
      setLeftContent(makeTextBlock([
        user
          ? { text: '[ about ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/about') }
          : { text: '[ sign in ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/auth') }
      ]));
    } else {
      setLeftContent(makeTextBlock([
        { text: '[ back ]', className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg font-bold transition', onClick: () => navigate('/') }
      ]));
    }

    // ----------------------------
    // Calculate progress stats
    // ----------------------------
    if (progress.last_review_date == today && !isPracticeAgain) {
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

    setCompactCounts({ practicing, mastered, unpracticed });

    setShowProgress(false)
    setShowTutorialProgress(false)

    if (lessonStatus == 'during') {
      if (isFirstLesson && (isIntroActive || tutorialStep < 6)) {
        setShowTutorialProgress(true)
        setMiddleContent(makeTextBlock(
          [
            { text: `tutorial`, className: 'text-fg font-bold', noPadding: true},
          ]
        ));
      } else {
        setShowProgress(true)
        setMiddleContent(makeTextBlock(
          [
            { text: `lesson ${Math.round(progressFraction * 100)}% complete`, className: 'text-fg font-bold', noPadding: true},
          ]
        ));
      }
    } else {
      setMiddleContent(makeTextBlock(
        [
          { text: '', className: 'text-fg font-bold' },
          { text: `${unpracticed} `, className: 'text-fg brightness-60 font-bold' },
          { text: 'unpracticed  ', className: 'text-fg' },
          { text: `${practicing} `, className: 'text-practiced font-bold' },
          { text: 'learning  ', className: 'text-fg' },
          { text: `${mastered} `, className: 'text-mastered font-bold' },
          { text: 'mastered', className: 'text-fg' },
          { text: '', className: 'text-fg font-bold' },
        ].map(item => ({ ...item, onClick: () => navigate('/about') }))
      ));
    }

    // ----------------------------
    // Right content
    // ----------------------------
    if (currentPath === '/about' && isWeb) {
      setRightContent(makeTextBlock([
        { text: user ? '[ sign out ]' : '[ sign in ]', className: 'text-fg font-bold active:text-bg active:bg-fg hover:text-bg hover:bg-fg transition', 
          onClick: () => user ? logoutAndRedirect(navigate) : navigate('/auth')}
      ]));
    } else if (currentPath === '/options') {
      setRightContent(makeTextBlock([
        { text: '[ back ]', className: 'text-fg active:text-bg active:bg-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/') }
      ]));
    } else {
      setRightContent(makeTextBlock([
        { text: '[ settings ]', className: 'text-fg active:text-bg active:bg-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/options') }
      ]));
    }
  }, [user, progress, completedSpots, lessonQueue, currentSpot, navigate, currentPath, loading, progressFraction, tutorialStep, isFirstLesson]);

  if (loading) return null;

  return (
    <div className="relative w-full overflow-visible select-none pt-4 px-4 lg:py-8 lg:py-6">

      {/* Foreground nav content */}
      <div className="relative flex justify-between items-center w-full h-full z-10 overflow-visible text-base sm:text-lg md:text-xl">
        <TextBox width={9} height={1} content={leftContent} />
          {!loading && compactCounts && lessonStatus !== 'during' && (
            <div className="flex sm:hidden font-mono text-sm items-center gap-1">
              <span className="text-fg/40 font-bold">{compactCounts.unpracticed}</span>
              <span className="text-fg/30">·</span>
              <span className="text-practiced font-bold">{compactCounts.practicing}</span>
              <span className="text-fg/30">·</span>
              <span className="text-mastered font-bold">{compactCounts.mastered}</span>
            </div>
          )}
          {!loading && (
            <div className={`relative w-fit text-center flex items-center ${lessonStatus !== 'during' ? 'hidden sm:flex' : 'flex'}`}>
              <TextBox width={40} height={1} content={middleContent} />

              {showProgress && (
                <div className="absolute top-full left-0 w-full h-1 bg-stone-700 rounded mt-1 pointer-events-none">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${progressFraction * 100}%`,
                      backgroundColor: interpolateColor(progressFraction),
                    }}
                  />
                </div>
              )}

              {showTutorialProgress && (
                <div className="absolute top-full left-0 w-full h-1 bg-stone-700 rounded mt-1 pointer-events-none">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${(isIntroActive ? introStep + 1 : 9 + tutorialStep + 1) / 15 * 100}%`,
                      backgroundColor: interpolateColor((isIntroActive ? introStep + 1 : 9 + tutorialStep + 1) / 15),
                    }}
                  />
                </div>
              )}
            </div>
          )}
        <TextBox width={12} height={1} content={rightContent} />
      </div>
    </div>
  );
}

export default Nav;
