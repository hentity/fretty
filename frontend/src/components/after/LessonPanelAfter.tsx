import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk, Spot } from '../../types';
import { MASTERED_THRESHOLD, spotKey } from '../../logic/lessonUtils';
import LessonCompleteText from '../before/LessonComplete';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import PracticeSelector from './PracticeSelector';
import Profile from '../../pages/Profile';

const BAR_WIDTH = 20;
const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';
const MONO = 'font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl';

type Tab = 'stats' | 'practice' | 'progress';

function LessonPanelAfter() {
  const { progress, practiceAgain, postPractice, setPostPractice } = useLesson();
  const [noteChunks, setNoteChunks] = useState<ColoredChunk[]>([]);
  const [masteryChunks, setMasteryChunks] = useState<ColoredChunk[]>([]);
  const [reviewChunks, setReviewChunks] = useState<ColoredChunk[]>([]);
  const [showReminderText, setShowReminderText] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  useEffect(() => {
    if (postPractice) {
      setActiveTab('practice');
      setPostPractice(false);
    }
  }, [postPractice, setPostPractice]);

  if (!progress?.recentSpots) {
    return (
      <div className="flex flex-col justify-between w-full h-full">
        <LessonCompleteText/>
      </div>
    );
  }

  const completedSpots = progress.recentSpots;


  // check reminders
  useEffect(() => {
    const checkReminders = async () => {
      const isWeb = Capacitor.getPlatform() === 'web';
      if (isWeb) return;
      const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
      setShowReminderText(value !== 'true');
    };
    checkReminders();
  }, []);

  useEffect(() => {
    if (!progress || completedSpots.length === 0) {
      setNoteChunks(makeTextBlock([{ text: 'no spots reviewed today.', className: 'text-fg' }]));
      setMasteryChunks([]);
      setReviewChunks([]);
      return;
    }

    const noteLines: ColoredChunk[] = [
      { text: 'note\n', className: 'text-fg font-bold pb-1', noPadding: true },
    ];
    const masteryLines: ColoredChunk[] = [
      { text: 'mastery\n', className: 'text-fg font-bold pb-1', noPadding: true },
    ];
    const reviewLines: ColoredChunk[] = [
      { text: 'next review\n', className: 'text-fg font-bold pb-1', noPadding: true },
    ];

    completedSpots.forEach((spot) => {
      const key = spotKey(spot);
      const reviewDate = progress.spot_to_review_date[key] ?? 'unscheduled';

      const fraction = Math.min(
        Math.log(spot.interval + 0.2) / Math.log(MASTERED_THRESHOLD + 0.2),
        1
      );
      const percent = String(Math.round(fraction * 100)).padStart(3, ' ');
      const filled  = Math.round(fraction * BAR_WIDTH);
      const empty   = BAR_WIDTH - filled;

      noteLines.push({ text: `${spot.note}, string ${spot.string + 1}\n`, className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: '#'.repeat(filled), className: 'text-easy font-bold brightness-100' });
      masteryLines.push({ text: '-'.repeat(empty), className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: ` ${percent}%\n`, className: 'text-fg brightness-80' });

      reviewLines.push({
        text: (() => {
          const now = new Date();
          const reviewDateObj = new Date(`${reviewDate}T00:00:00`);
          let relative = 'unscheduled';
          if (!isNaN(reviewDateObj.getTime())) {
            const diffMs   = reviewDateObj.getTime() - now.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
            if (diffDays === 1)       relative = 'tomorrow';
            else if (diffDays < 7)   relative = `in ${diffDays} days`;
            else if (diffDays < 30)  relative = `in ${Math.round(diffDays / 7)} week${Math.round(diffDays / 7) === 1 ? '' : 's'}`;
            else if (diffDays < 365) relative = `in ${Math.round(diffDays / 30)} month${Math.round(diffDays / 30) === 1 ? '' : 's'}`;
            else                     relative = `in ${Math.round(diffDays / 365)} year${Math.round(diffDays / 365) === 1 ? '' : 's'}`;
          }
          return `${relative}\n`;
        })(),
        className: 'text-fg brightness-80',
      });
    });

    setNoteChunks(makeTextBlock(noteLines));
    setMasteryChunks(makeTextBlock(masteryLines));
    setReviewChunks(makeTextBlock(reviewLines));
  }, [completedSpots, progress]);

  const height = completedSpots.length + 1;


  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-y-auto gap-2">

      {/* segmented toggle */}
      <div className={`${MONO} relative mb-2 py-0.5 flex cursor-pointer select-none rounded-lg overflow-hidden outline outline-2 outline-fg`} style={{ minWidth: '34rem' }}>
        {/* sliding highlight */}
        <div
          className="absolute inset-0 w-1/3 bg-fg transition-transform duration-300 ease-in-out"
          style={{
            transform: activeTab === 'practice' ? 'translateX(100%)' : activeTab === 'progress' ? 'translateX(200%)' : 'translateX(0)'
          }}
        />
        <button
          onClick={() => setActiveTab('stats')}
          className={`relative z-10 flex-1 flex items-center justify-center font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'stats' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'}`}
        >
          daily lesson
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`relative z-10 flex-1 flex items-center justify-center font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'practice' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'}`}
        >
          practice lesson
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`relative z-10 flex-1 flex items-center justify-center font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'progress' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'}`}
        >
          my progress
        </button>
      </div>

      {/* content — both panels share the same grid cell so height is always the max */}
      <div className="grid items-start">
        {/* stats panel */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex flex-col items-center gap-1 transition-opacity duration-200 ${activeTab !== 'stats' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <TextBox width={30} height={1} content={makeTextBlock([{ text: 'DAILY LESSON COMPLETE!', className: 'text-fg font-bold' }])} />
          <TextContainer width={65} height={height + 1}>
            <div className="flex flex-row items-center justify-center w-full h-full">
              <TextBox width={18} height={height} content={noteChunks} />
              <TextBox width={27} height={height} content={masteryChunks} />
              <TextBox width={18} height={height} content={reviewChunks} />
            </div>
          </TextContainer>
          <TextBox width={60} height={1} content={[{ text: 'see you tomorrow :)', className: 'text-fg' }]} />
          {showReminderText && (
            <TextBox
              width={55}
              height={2}
              content={[{ text: 'tip: you can enable practice reminders in settings', className: 'text-fg bg-stone-700 outline-2 outline-stone-700' }]}
            />
          )}
        </div>
        {/* practice panel */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex items-start justify-center transition-opacity duration-200 ${activeTab !== 'practice' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <PracticeSelector onStart={(spots: Spot[]) => practiceAgain(spots)} />
        </div>
        {/* progress panel */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex items-start justify-center transition-opacity duration-200 ${activeTab !== 'progress' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <Profile />
        </div>
      </div>

    </div>
  );
}

export default LessonPanelAfter;
