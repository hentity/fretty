import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/UserContext';
import useProgress from '../hooks/useProgress';
import { TextBox } from '../components/TextBox';
import { makeTextBlock } from '../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../types';
import { useLesson } from '../context/LessonContext';

const MASTERED_THRESHOLD = 10;

function Nav() {
  const navigate = useNavigate();
  const { progress } = useLesson();
  const { user } = useAuth();

  const [leftContent, setLeftContent] = useState<ColoredChunk[]>([]);
  const [middleContent, setMiddleContent] = useState<ColoredChunk[]>([]);
  const [rightContent, setRightContent] = useState<ColoredChunk[]>([]);

  useEffect(() => {
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

    // Left TextBox
    setLeftContent(makeTextBlock([
      user
        ? { text: '[ Home ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold ', onClick: () => navigate('/') }
        : { text: '[ Sign In ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold', onClick: () => navigate('/auth') }
    ]));

    // Middle TextBox
    const middleChunks: ColoredChunk[] = [];
    if (user) {
      middleChunks.push({ text: `${practicingCount} `, className: 'text-practiced font-bold' });
      middleChunks.push({ text: `learning   `, className: 'text-practiced' });
      middleChunks.push({ text: `${masteredCount} `, className: 'text-mastered font-bold' });
      middleChunks.push({ text: `mastered   `, className: 'text-mastered' });
      middleChunks.push({ text: `${unpracticedCount} `, className: 'text-unpracticed font-bold' });
      middleChunks.push({ text: `unpracticed`, className: 'text-unpracticed' });
    }
    setMiddleContent(makeTextBlock(middleChunks));

    // Right TextBox
    setRightContent(makeTextBlock([
      { text: '[ Help ]', className: 'text-fg hover:bg-fg hover:text-bg font-bold', onClick: () => navigate('/help') }
    ]));
  }, [user, progress, navigate]);

  return (
    <div className="flex justify-between items-center w-full px-4">
      <TextBox width={15} height={3} content={leftContent} />
      <TextBox width={80} height={3} content={middleContent} />
      <TextBox width={15} height={3} content={rightContent} />
    </div>
  );
}

export default Nav;
