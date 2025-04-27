import { useRef } from 'react';
import { useLesson } from '../../../context/LessonContext';
import Timer, { TimerHandle } from './Timer';
import LessonProgress from './LessonProgress';
import Fretboard from './Fretboard';
import { TextContainer } from '../../../components/TextContainer';

function LessonPanelDuring() {
  const { advance } = useLesson();
  const timerRef = useRef<TimerHandle | null>(null);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={80} height={21}>
        <div className="flex flex-col w-full h-full justify-between items-center border border-borderDebug">
          <div className="w-full">
            <LessonProgress />
          </div>

          <div className="w-full flex items-center justify-center">
            <Fretboard />
          </div>

          <div className="w-full">
            <Timer
              ref={timerRef}
              totalTime={5000}
              easyTime={1700}
              goodTime={3000}
              onComplete={advance}
            />
          </div>
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelDuring;
