import { useEffect, useState } from 'react';
import NotePanelDuring from './note_panel/NotePanelDuring';
import LessonPanelDuring from './lesson_panel/LessonPanelDuring';
import { useLesson } from '../../context/LessonContext';
import { useIntroTour } from '../../context/IntroTourContext';
import { LEARNING_GOOD_ATTEMPTS } from '../../logic/lessonUtils';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';
import FirstLessonGuide from './FirstLessonGuide';
import IntroTour from './IntroTour';

function During() {
  const { isFirstLesson, lessonStep, result, currentSpot } = useLesson();
  const { isIntroActive } = useIntroTour();
  const [noteComplete, setNoteComplete] = useState(false);

  useEffect(() => { setNoteComplete(false); }, [lessonStep]);

  useEffect(() => {
    if (result && currentSpot && currentSpot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
      setNoteComplete(true);
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const noteCompleteContent = makeTextBlock(
    noteComplete
      ? [{ text: ' note complete! ', className: 'text-bg font-bold', noPadding: true }]
      : [{ text: '' }]
  );

  return (
    <div className="relative flex flex-col gap-0 md:gap-4">
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
          <TextBox width={50} height={1} content={noteCompleteContent} className="bg-fg" />
        </div>
      )}

      {/* Main panel layout */}
      <div className="flex gap-4">
        {/* Note Panel */}
        <div className="h-full flex justify-right">
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

