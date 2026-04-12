import { useEffect, useState } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { useIntroTour } from '../../../context/IntroTourContext';
import { LEARNING_GOOD_ATTEMPTS } from '../../../logic/lessonUtils';
import { TextContainer } from '../../TextContainer';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import { asciiArtMap } from '../../../styling/asciiArt';
import { playEasy, playGood, playHard, playNoteComplete } from '../../../logic/sounds';


function NotePanelDuring() {
  const { currentSpot, result, lessonStep, isPausing } = useLesson();
  const { isIntroActive, introStep, introHighlight, introPipCount, introResult, introDemoComplete } = useIntroTour();

  const isDemoStep = introStep >= 4 && introStep <= 7;

  const [noteKey, setNoteKey] = useState(0);
  const [noteAnimClass, setNoteAnimClass] = useState('');

  // Reset animations when the next spot loads
  useEffect(() => {
    setNoteAnimClass('');
    setNoteKey(k => k + 1);
  }, [lessonStep]);

  // Trigger animation on real lesson result
  useEffect(() => {
    if (result && result !== 'fail' && !isIntroActive) {
      const pips = currentSpot?.good_attempts ?? 0;
      const completing = pips >= LEARNING_GOOD_ATTEMPTS;
      const note = currentSpot?.note ?? 'C';
      const octave = currentSpot?.octave ?? 5;
      if (completing) {
        playNoteComplete(note, octave);
      } else if (pips >= 2) {
        playEasy(note, octave);
      } else if (pips >= 1) {
        playGood(note, octave);
      } else {
        playHard(note, octave);
      }
      setNoteAnimClass(completing ? 'animate-note-complete' : 'animate-note-success');
      setNoteKey(k => k + 1);
    }
  }, [result, isIntroActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // When note is detected after a fail, play success animation + hard sound
  useEffect(() => {
    if (isPausing && result === 'fail' && !isIntroActive) {
      playHard(currentSpot?.note ?? 'C', currentSpot?.octave ?? 5);
      setNoteAnimClass('animate-note-success');
      setNoteKey(k => k + 1);
    }
  }, [isPausing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trigger animation when intro demo animation completes
  useEffect(() => {
    if (isIntroActive && introDemoComplete && introResult) {
      setNoteAnimClass(introResult === 'fail' ? 'animate-note-fail' : 'animate-note-success');
      setNoteKey(k => k + 1);
    }
  }, [introDemoComplete, isIntroActive, introResult]);

  const highlighted = isIntroActive && introHighlight === 'notePanel';
  const dimmed = isIntroActive && introHighlight !== 'notePanel' && !isDemoStep;
  const wrapperClass = `transition-all duration-300 ${dimmed ? 'brightness-30' : ''} ${highlighted ? 'bg-stone-900 rounded outline outline-2 outline-stone-500 outline-offset-4 animate-brightness-pulse' : ''}`;

  if (!currentSpot) {
    const noSpotContent = makeTextBlock([
      { text: "No spot selected.", className: 'text-fg' }
    ]);

    return (
      <div className={wrapperClass}>
        <div className="flex justify-center items-center w-full h-full">
          <TextContainer width={20} height={21}>
            <div className="flex flex-col items-center justify-center w-full h-full">
              <TextBox width={20} height={3} content={noSpotContent} />
            </div>
          </TextContainer>
        </div>
      </div>
    );
  }

  const noteArtRaw = asciiArtMap[currentSpot.note as keyof typeof asciiArtMap] || currentSpot.note;

  const filledSymbol = '■';
  const emptySymbol = '□';

  const resultToColorClass = {
    easy: 'text-easy',
    good: 'text-good',
    hard: 'text-hard',
    fail: 'text-fail'
  } as const;

  const displayResult = isIntroActive ? introResult : result;
  const progressColorClass = displayResult ? resultToColorClass[displayResult] : 'text-fg';

  const noteArtColorClass = displayResult ? resultToColorClass[displayResult] : 'text-fg';

  const noteArtContent = makeTextBlock([
    { text: noteArtRaw, className: `${noteArtColorClass} font-bold`, noPadding: true}
  ]);

  const displayPipCount = isIntroActive ? introPipCount : currentSpot.good_attempts;
  const progressMarkers = Array(LEARNING_GOOD_ATTEMPTS).fill(emptySymbol)
    .map((_, idx) => idx < displayPipCount ? filledSymbol : emptySymbol)
    .join(' ');

  const progressContent = makeTextBlock([
    { text: progressMarkers, className: `${progressColorClass} font-bold` }
  ]);

  const feedbackMap = {
    easy: { text: " easy! ", className: "bg-easy text-bg font-bold" },
    good: { text: " good ", className: "bg-good text-bg font-bold" },
    hard: { text: " hard ", className: "bg-hard text-bg font-bold" },
    fail: { text: " fail ", className: "bg-fail text-bg font-bold" },
  } as const;

  const feedbackContent = displayResult
    ? makeTextBlock([{ text: feedbackMap[displayResult].text, className: feedbackMap[displayResult].className, noPadding: true }])
    : makeTextBlock([{text: ''}]);

  return (
    <div className={wrapperClass}>
      <div className="flex justify-center items-center w-full h-full">
        <TextContainer width={11} height={9}>
          <div className="flex flex-col items-center justify-center w-full h-full">
            <TextBox width={11} height={2} content={[]} />
            <div key={noteKey} className={noteAnimClass}>
              <TextBox width={11} height={6} content={noteArtContent} />
            </div>
            <div className={isDemoStep ? 'bg-stone-900 rounded outline outline-2 outline-stone-500 animate-brightness-pulse' : ''}>
              <TextBox width={11} height={1} content={progressContent} />
            </div>
            <TextBox width={11} height={2} content={feedbackContent} />
          </div>
        </TextContainer>
      </div>
    </div>
  );
}


export default NotePanelDuring;
