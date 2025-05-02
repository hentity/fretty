import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../../types';
import { spotKey } from '../../logic/lessonUtils';

const MASTERED_THRESHOLD = 14;
const BAR_WIDTH = 20;

function LessonPanelAfter() {
  const { completedSpots, progress } = useLesson();
  const [noteChunks, setNoteChunks] = useState<ColoredChunk[]>([]);
  const [masteryChunks, setMasteryChunks] = useState<ColoredChunk[]>([]);
  const [reviewChunks, setReviewChunks] = useState<ColoredChunk[]>([]);

  const title: ColoredChunk[] = [
    { text: 'See you tomorrow!', className: 'text-fg font-bold' },
  ];

  useEffect(() => {
    if (!progress || completedSpots.length === 0) {
      const noReview = makeTextBlock([{ text: 'No spots reviewed today.', className: 'text-fg' }]);
      setNoteChunks(noReview);
      setMasteryChunks([]);
      setReviewChunks([]);
      return;
    }

    const noteLines: ColoredChunk[] = [
      { text: 'Note\n', className: 'text-fg underline pb-1', noPadding: true},
    ];
    const masteryLines: ColoredChunk[] = [
      { text: 'Mastery\n', className: 'text-fg underline pb-1', noPadding: true },
    ];
    const reviewLines: ColoredChunk[] = [
      { text: 'Next Review\n', className: 'text-fg underline pb-1', noPadding: true },
    ];

    completedSpots.forEach((spot) => {
      const key = spotKey(spot);
      const reviewDate = progress.spot_to_review_date[key] ?? 'unscheduled';

      const fraction = Math.min(
        Math.log(spot.interval) / Math.log(MASTERED_THRESHOLD),
        1
      );
      const percent = Math.round(fraction * 100);
      const filled = Math.round(fraction * BAR_WIDTH);
      const empty = BAR_WIDTH - filled;

      noteLines.push({
        text: `[${spot.note}, string ${spot.string + 1}]\n`,
        className: 'text-fg brightness-80',
      });

      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: '█'.repeat(filled), className: 'text-easy brightness-80' });
      masteryLines.push({ text: '-'.repeat(empty), className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: ` ${percent}%\n`, className: 'text-fg brightness-80' });

      reviewLines.push({
        text: `${reviewDate}\n`,
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
      <TextBox width={90} height={1} content={title} />
      <TextContainer width={90} height={height+1}>
        <div className="flex flex-row items-center justify-center w-full h-full">
          <TextBox width={28} height={height} content={noteChunks} />
          <TextBox width={28} height={height} content={masteryChunks} />
          <TextBox width={28} height={height} content={reviewChunks} />
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelAfter;
