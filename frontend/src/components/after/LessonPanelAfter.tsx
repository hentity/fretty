import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../../types';
import { spotKey } from '../../logic/lessonUtils';

const MASTERED_THRESHOLD = 14;

function LessonPanelAfter() {
  const { completedSpots, progress } = useLesson();
  const [content, setContent] = useState<ColoredChunk[]>([]);

  useEffect(() => {
    if (!progress || completedSpots.length === 0) {
      setContent(makeTextBlock([
        { text: 'No spots reviewed today.', className: 'text-fg' }
      ]));
      return;
    }

    const header: ColoredChunk[] = [
      { text: 'Lesson Review\n\n', className: 'text-fg font-bold' },
    ];

    const chunks: ColoredChunk[] = completedSpots.map((spot) => {
      const key = spotKey(spot);
      const reviewDate = progress.spot_to_review_date[key] ?? 'unscheduled';
      const percent = Math.min(
        Math.round((Math.log(spot.interval + 1) / Math.log(MASTERED_THRESHOLD + 1)) * 100),
        100
      );

      const line = `[${spot.note}, string ${spot.string + 1}] ${percent}% mastered | next review: ${reviewDate}\n`;
      return { text: line, className: 'text-fg' };
    });

    setContent(makeTextBlock([...header, ...chunks]));
  }, [completedSpots, progress]);

  return (
    <div className="flex justify-center items-start w-full h-full overflow-y-auto">
      <TextContainer width={100} height={completedSpots.length * 2 + 4}>
        <div className="flex flex-col items-center justify-center w-full h-full border border-borderDebug">
          <TextBox
            width={60}
            height={completedSpots.length * 2 + 2}
            content={content}
          />
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelAfter;
