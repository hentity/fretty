import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';
import { LEARNING_GOOD_ATTEMPTS } from '../../logic/lessonUtils';
import { spotKey } from '../../logic/lessonUtils'; // import your helper to generate keys

function LessonProgress() {
  const { completedSpots, lessonQueue, currentSpot } = useLesson();

  // collect all spots
  const rawSpots = [
    ...completedSpots,
    ...(lessonQueue || []),
    ...(currentSpot ? [currentSpot] : [])
  ];

  // deduplicate spots based on string-fret key
  const spotMap = new Map<string, typeof rawSpots[number]>();
  for (const spot of rawSpots) {
    spotMap.set(spotKey(spot), spot);
  }
  const allSpots = Array.from(spotMap.values());

  const totalSpots = allSpots.length;

  const totalGoodAttempts = allSpots.reduce((sum, spot) => sum + (spot.good_attempts || 0), 0);

  const maxGoodAttempts = totalSpots * LEARNING_GOOD_ATTEMPTS;

  const progressFraction = maxGoodAttempts > 0 ? totalGoodAttempts / maxGoodAttempts : 0;

  const barWidth = 61; // leave room for side borders
  const filledBlocks = Math.round(barWidth * progressFraction);
  const emptyBlocks = barWidth - filledBlocks;

  const progressBarComplete = `${'█'.repeat(filledBlocks)}`;
  const progressBarIncomplete = `${'█'.repeat(emptyBlocks)}`;

  const barContent = makeTextBlock([
    { text: '|', className: 'text-fg font-bold' },
    { text: progressBarComplete, className: 'text-fg' },
    { text: progressBarIncomplete, className: 'text-stone-800' },
    { text: '|', className: 'text-fg font-bold' },
  ]);

  return (
    <div className="flex flex-col items-center w-full">
      <TextBox width={barWidth + 2} height={2} content={barContent} />
    </div>
  );
}

export default LessonProgress;
