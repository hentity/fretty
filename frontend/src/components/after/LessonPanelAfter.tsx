import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../../types';
import { MASTERED_THRESHOLD, spotKey } from '../../logic/lessonUtils';
import { useAuth } from '../../context/UserContext';
import LessonCompleteText from '../before/LessonComplete';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const BAR_WIDTH = 20;
const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';

function LessonPanelAfter() {
  const { progress } = useLesson();
  const { user } = useAuth()
  const [noteChunks, setNoteChunks] = useState<ColoredChunk[]>([]);
  const [masteryChunks, setMasteryChunks] = useState<ColoredChunk[]>([]);
  const [reviewChunks, setReviewChunks] = useState<ColoredChunk[]>([]);
  const [showReminderText, setShowReminderText] = useState(false); 

  if (!progress?.recentSpots) {
    return (
      <div className="flex flex-col justify-between w-full h-full">
        <LessonCompleteText/>
      </div>
    )
  }
  const completedSpots = progress.recentSpots;

  const seeYaTomorrow: ColoredChunk[] = [
    { text: 'see you tomorrow :)', className: 'text-fg' },
  ];

  const tip: ColoredChunk[] = []

  if (!user) {
    tip.push({text: 'LESSON COMPLETE!', className: 'text-fg font-bold'})
  }

  // check reminders
  useEffect(() => {
    const checkReminders = async () => {
      const isWeb = Capacitor.getPlatform() === 'web';
      if (isWeb) return;

      const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
      const remindersEnabled = value === 'true';
      setShowReminderText(!remindersEnabled);
    };
    checkReminders();
  }, []);

  useEffect(() => {
    if (!progress || completedSpots.length === 0) {
      const noReview = makeTextBlock([{ text: 'no spots reviewed today.', className: 'text-fg' }]);
      setNoteChunks(noReview);
      setMasteryChunks([]);
      setReviewChunks([]);
      return;
    }

    const noteLines: ColoredChunk[] = [
      { text: 'note\n', className: 'text-fg font-bold pb-1', noPadding: true},
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
      const filled = Math.round(fraction * BAR_WIDTH);
      const empty = BAR_WIDTH - filled;

      noteLines.push({
        text: `${spot.note}, string ${spot.string + 1}\n`,
        className: 'text-fg brightness-80'
      });

      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: '#'.repeat(filled), className: 'text-easy font-bold brightness-100' }); // █
      masteryLines.push({ text: '-'.repeat(empty), className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: ` ${percent}%\n`, className: 'text-fg brightness-80' });

      reviewLines.push({
        text: (() => {
          const now = new Date();
          const reviewDateObj = new Date(`${reviewDate}T00:00:00`);
          let relative = 'unscheduled';
      
          if (!isNaN(reviewDateObj.getTime())) {
            const diffMs = reviewDateObj.getTime() - now.getTime();
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
      
            if (diffDays === 1) {
              relative = 'tomorrow';
            } else if (diffDays < 7) {
              relative = `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
            } else if (diffDays < 30) {
              const weeks = Math.round(diffDays / 7);
              relative = `in ${weeks} week${weeks === 1 ? '' : 's'}`;
            } else if (diffDays < 365) {
              const months = Math.round(diffDays / 30);
              relative = `in ${months} month${months === 1 ? '' : 's'}`;
            } else {
              const years = Math.round(diffDays / 365);
              relative = `in ${years} year${years === 1 ? '' : 's'}`;
            }
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
    <div className="flex flex-col justify-center items-center w-full h-full overflow-y-auto">
      <TextBox width={90} height={1} content={tip} />
      <TextContainer width={90} height={height+1}>
        <div className="flex flex-row items-center justify-center w-full h-full">
          <TextBox width={27} height={height} content={noteChunks} />
          <TextBox width={27} height={height} content={masteryChunks} />
          <TextBox width={28} height={height} content={reviewChunks} />
        </div>
      </TextContainer>
      <TextBox width={90} height={2} content={seeYaTomorrow} />
      {showReminderText && (
      <TextBox
        width={80}
        height={2}
        content={[
          {
            text: 'tip: you can enable practice reminders in settings',
            className: 'text-fg bg-stone-700 outline-2 outline-stone-700',
          },
        ]}
      />
    )}
    </div>
  );
}

export default LessonPanelAfter;
