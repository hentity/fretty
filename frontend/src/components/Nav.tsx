import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/UserContext';
import { TextBox } from '../components/TextBox';
import { makeTextBlock } from '../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../types';
import { useLesson } from '../context/LessonContext';
import { LEARNING_GOOD_ATTEMPTS, spotKey } from '../logic/lessonUtils';

const MASTERED_THRESHOLD = 10;

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
  const { completedSpots, lessonQueue, currentSpot, progress } = useLesson();

  const [leftContent, setLeftContent] = useState<ColoredChunk[]>([]);
  const [middleContent, setMiddleContent] = useState<ColoredChunk[]>([]);
  const [rightContent, setRightContent] = useState<ColoredChunk[]>([]);
  const [progressFraction, setProgressFraction] = useState(0);

  useEffect(() => {
    // ----------------------------
    // Calculate progressFraction
    // ----------------------------
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

    // ----------------------------
    // Left box content
    // ----------------------------
    if (currentPath === '/') {
      setLeftContent(makeTextBlock([
        user
          ? { text: '[ profile ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/profile') }
          : { text: '[ sign in ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/auth') }
      ]));
    } else {
      setLeftContent(makeTextBlock([
        { text: '[ home ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/') }
      ]));
    }

    // ----------------------------
    // Middle box content
    // ----------------------------
    let practicingCount = 0;
    let masteredCount = 0;
    let unpracticedCount = 0;

    if (progress) {
      progress.spots.forEach(spot => {
        if (spot.status !== 'unlearnable') {
          if (spot.interval >= MASTERED_THRESHOLD) {
            masteredCount++;
          } else if (spot.num_practices > 0) {
            practicingCount++;
          } else {
            unpracticedCount++;
          }
        }
      });
    }

    const middleChunks: ColoredChunk[] = [];
    middleChunks.push({ text: `[ `, className: 'text-fg bg-bg font-bold' });
    middleChunks.push({ text: `${practicingCount} `, className: 'text-practiced bg-bg font-bold' });
    middleChunks.push({ text: `learning   `, className: 'text-fg bg-bg' });
    middleChunks.push({ text: `${masteredCount} `, className: 'text-mastered bg-bg font-bold' });
    middleChunks.push({ text: `mastered   `, className: 'text-fg bg-bg' });
    middleChunks.push({ text: `${unpracticedCount} `, className: 'text-fg brightness-60 bg-bg font-bold' });
    middleChunks.push({ text: `unpracticed`, className: 'text-fg bg-bg' });
    middleChunks.push({ text: ` ]`, className: 'text-fg bg-bg font-bold' });
    setMiddleContent(makeTextBlock(middleChunks));

    // ----------------------------
    // Right box content
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
        { text: '[ help ]', className: 'text-fg active:text-bg active:bg-fg hover:bg-fg hover:text-bg font-bold transition', onClick: () => navigate('/help') }
      ]));
    }
  }, [user, progress, completedSpots, lessonQueue, currentSpot, navigate, currentPath]);

  function interpolateColor(progress: number): string {
    // Tailwind red-600 → yellow-400 → green-600
    const red = [224, 149, 62];     // #dc2626
    const yellow = [106, 153, 78]; // #facc15
    const green = [84, 152, 171];   // #16a34a
  
    let from: number[], to: number[], t: number;
  
    if (progress < 0.5) {
      from = red;
      to = yellow;
      t = progress / 0.5;
    } else {
      from = yellow;
      to = green;
      t = (progress - 0.5) / 0.5;
    }
  
    const rgb = from.map((start, i) => Math.round(start + t * (to[i] - start)));
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Background progress fill */}
      <div
        className="absolute bottom-0 left-0 h-1 transition-all duration-300"
        style={{ width: `${progressFraction * 100}%`, zIndex: 0, backgroundColor: interpolateColor(progressFraction),}}
      />

      {/* Foreground content */}
      <div className="relative z-10 flex justify-between items-center w-full px-4 h-full">
        <TextBox width={15} height={3} content={leftContent} />
        <TextBox width={80} height={3} content={middleContent} />
        <TextBox width={15} height={3} content={rightContent} />
      </div>
    </div>
  );
}

export default Nav;
