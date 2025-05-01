import NotePanelDuring from './note_panel/NotePanelDuring';
import LessonPanelDuring from './lesson_panel/LessonPanelDuring';
import { useLesson } from '../../context/LessonContext';
import FirstLessonGuide from './FirstLessonGuide';

function During() {
  const { isFirstLesson, lessonStep } = useLesson();

  return (
    <div className="flex flex-col gap-2">
      {isFirstLesson && lessonStep === 0 && (
        <div className="flex justify-center">
          <FirstLessonGuide />
        </div>
      )}

      {/* Main panel layout */}
      <div className="flex border border-borderDebug gap-4">
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

