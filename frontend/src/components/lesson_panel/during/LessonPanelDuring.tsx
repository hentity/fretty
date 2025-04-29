import LessonProgress from './LessonProgress';
import Fretboard from './Fretboard';
import { TextContainer } from '../../../components/TextContainer';
import TimerBar from './TimerBar';

function LessonPanelDuring() {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={60} height={12}>
        <div className="flex flex-col w-full h-full justify-center items-center border border-borderDebug">
          <div className="w-full">
            <LessonProgress />
          </div>

          <div className="w-full flex items-center justify-center">
            <Fretboard />
          </div>

          <div className="w-full">
            <TimerBar totalTime={5} easyTime={2} goodTime={3} />
          </div>
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelDuring;
