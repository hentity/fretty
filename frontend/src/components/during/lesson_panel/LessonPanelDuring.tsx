import Fretboard from './Fretboard';
import { TextContainer } from '../../TextContainer';
import TimerBar from './TimerBar';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';

function LessonPanelDuring() {
  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={52} height={9}>
        <div className="flex flex-col w-full h-full justify-center items-center">
          <TextBox width={18} height={1} content={makeTextBlock([{ text: '' }])} />
          <Fretboard />
          <TimerBar totalTime={5} easyTime={2} goodTime={3} />
          {/* <TextBox width={18} height={1} content={makeTextBlock([{ text: '' }])} /> */}
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelDuring;
