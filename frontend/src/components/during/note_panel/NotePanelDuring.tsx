import { useLesson } from '../../../context/LessonContext';
import { LEARNING_GOOD_ATTEMPTS } from '../../../logic/lessonUtils';
import { TextContainer } from '../../TextContainer';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import { asciiArtMap } from '../../../styling/asciiArt';

function NotePanelDuring() {
  const { currentSpot, result } = useLesson();

  if (!currentSpot) {
    const noSpotContent = makeTextBlock([
      { text: "No spot selected.", className: 'text-fg' }
    ]);

    return (
      <div className="flex justify-center items-center w-full h-full">
        <TextContainer width={20} height={21}>
          <div className="flex flex-col items-center justify-center w-full h-full">
            <TextBox width={20} height={3} content={noSpotContent} />
          </div>
        </TextContainer>
      </div>
    );
  }

  const stringNumber = currentSpot?.string + 1;

  const stringSuffix = (n: number) => {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
  };

  const stringName = stringNumber !== undefined ? `${stringNumber}${stringSuffix(stringNumber)} string` : '';

  const stringContent = makeTextBlock([
    { text: stringName, className: 'text-fg font-bold', noPadding: true }
  ]);

  const noteArtRaw = asciiArtMap[currentSpot.note as keyof typeof asciiArtMap] || currentSpot.note;

  const noteArtContent = makeTextBlock([
    { text: noteArtRaw.trim(), className: 'text-fg font-bold', noPadding: true}
  ]);

  // Progress indicators
  const filledSymbol = '■';
  const emptySymbol = '□';

  // 🔥 New: map result -> color
  const resultToColorClass = {
    easy: 'text-easy',
    good: 'text-good',
    hard: 'text-hard',
    fail: 'text-fail'
  } as const;

  const progressColorClass = result ? resultToColorClass[result] : 'text-fg'; // default if no result yet

  const progressMarkers = Array(LEARNING_GOOD_ATTEMPTS).fill(emptySymbol)
    .map((_, idx) => idx < currentSpot.good_attempts ? filledSymbol : emptySymbol)
    .join(' ');

  const progressContent = makeTextBlock([
    { text: progressMarkers, className: `${progressColorClass} font-bold` }
  ]);

  // Feedback label if result exists
  const feedbackMap = {
    easy: { text: " easy! ", className: "bg-easy text-bg font-bold" },
    good: { text: " good ", className: "bg-good text-bg font-bold" },
    hard: { text: " hard ", className: "bg-hard text-bg font-bold" },
    fail: { text: " fail ", className: "bg-fail text-bg font-bold" },
  } as const;

  const feedbackContent = result
    ? makeTextBlock([
        {
          text: feedbackMap[result].text,
          className: feedbackMap[result].className,
          noPadding: true
        }
      ])
    : makeTextBlock([{text: ''}]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={11} height={9}>
        <div className="flex flex-col items-center justify-center w-full h-full">
          
          {/* Main content */}
          <TextBox width={11} height={1} content={stringContent} />
          <TextBox width={11} height={6} content={noteArtContent} />
          <TextBox width={11} height={1} content={progressContent} />

          {/* Feedback label */}
          <TextBox width={11} height={1} content={feedbackContent} />
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelDuring;
