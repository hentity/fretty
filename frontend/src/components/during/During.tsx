import { useEffect, useState, useRef } from 'react';
import NotePanelDuring from './note_panel/NotePanelDuring';
import LessonPanelDuring from './lesson_panel/LessonPanelDuring';
import { useLesson } from '../../context/LessonContext';
import { useIntroTour } from '../../context/IntroTourContext';
import { LEARNING_GOOD_ATTEMPTS, MASTERED_THRESHOLD } from '../../logic/lessonUtils';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';
import FirstLessonGuide from './FirstLessonGuide';
import IntroTour from './IntroTour';

const RESULT_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  good: 'var(--color-good)',
};

function During() {
  const { isFirstLesson, lessonStep, result, currentSpot, isPracticeAgain } = useLesson();
  const { isIntroActive } = useIntroTour();
  const [noteComplete, setNoteComplete] = useState(false);
  const [completeResult, setCompleteResult] = useState<'easy' | 'good' | null>(null);
  const [completeLabel, setCompleteLabel] = useState('note complete!');
  const notePanelRef = useRef<HTMLDivElement>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [rippleStyle, setRippleStyle] = useState<React.CSSProperties>({});
  const spotInitialStatusRef = useRef<string | null>(null);

  // Capture the spot's status before any result comes in
  useEffect(() => {
    if (currentSpot && !result) {
      spotInitialStatusRef.current = currentSpot.status;
    }
  }, [currentSpot, result]);

  useEffect(() => { setNoteComplete(false); }, [lessonStep]);

  useEffect(() => {
    if (result && currentSpot && currentSpot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
      setNoteComplete(true);
      setCompleteResult(result === 'easy' ? 'easy' : 'good');

      if (isPracticeAgain) {
        setCompleteLabel('note practiced!');
      } else if (spotInitialStatusRef.current === 'learning') {
        setCompleteLabel('new note learned!');
      } else if (currentSpot.interval >= MASTERED_THRESHOLD) {
        setCompleteLabel('note mastered!');
      } else {
        setCompleteLabel('note reviewed!');
      }

      if (notePanelRef.current) {
        const rect = notePanelRef.current.getBoundingClientRect();
        setRippleStyle({
          left: rect.left + rect.width / 2,
          top: rect.top + rect.height / 2,
          backgroundColor: RESULT_COLORS[result] ?? 'var(--color-good)',
        });
        setRippleKey(k => k + 1);
      }
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const noteCompleteContent = makeTextBlock(
    noteComplete
      ? [{ text: ` ${completeLabel} `, className: `text-bg font-bold bg-${completeResult ?? 'good'}`, noPadding: true }]
      : [{ text: '' }]
  );

  return (
    <div className="relative flex flex-col gap-0 md:gap-4">
      {rippleKey > 0 && !isFirstLesson && !isIntroActive && (
        <div
          key={rippleKey}
          className="fixed pointer-events-none z-50 animate-ripple-complete"
          style={{ width: 20, height: 20, borderRadius: '50%', ...rippleStyle }}
        />
      )}
      {isIntroActive && (
        <div className="flex justify-center">
          <IntroTour />
        </div>
      )}
      {!isIntroActive && isFirstLesson && lessonStep === 0 && (
        <div className="flex justify-center">
          <FirstLessonGuide />
        </div>
      )}
      {!isIntroActive && !isFirstLesson && noteComplete && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none z-10 animate-banner-blink">
          <TextBox width={50} height={1} content={noteCompleteContent} />
        </div>
      )}

      {/* Main panel layout */}
      <div className="flex gap-4">
        {/* Note Panel */}
        <div ref={notePanelRef} className="h-full flex justify-right">
          <NotePanelDuring />
        </div>

        {/* Lesson Panel */}
        <div className="h-full flex justify-center">
          <LessonPanelDuring />
        </div>
      </div>
    </div>
  );
}

export default During;

