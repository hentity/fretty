import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../../components/TextBox';
import { TextContainer } from '../../../components/TextContainer';
import { makeTextBlock } from '../../../styling/stylingUtils';

function NotePanelBefore() {
  const { startLesson } = useLesson();

  const buttonContent = makeTextBlock([
    { text: '                \n  Start Lesson  \n                ', onClick: startLesson, className: ' font-bold bg-good text-bg group-hover:brightness-110' },
  ]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={22} height={21}>
        <div className="flex flex-col items-center justify-center w-full h-full">
          <TextBox
            width={16}
            height={3}
            content={buttonContent}
          />
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelBefore;
