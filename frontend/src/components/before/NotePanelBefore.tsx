import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';

function NotePanelBefore() {
  const { startLesson } = useLesson();

  const buttonContent = makeTextBlock([
    { text: '⌜             ⌝\n', onClick: startLesson, className: 'group-active:text-easy group-hover:text-easy transition' },
    { text: '    begin    \n', onClick: startLesson, className: '' },
    { text: '⌞             ⌟\n', onClick: startLesson, className: 'group-active:text-easy group-hover:text-easy transition' },
  ]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={15} height={5}>
        <div className="flex flex-col items-right justify-center w-full h-full">
          <TextBox
            width={15}
            height={3}
            content={buttonContent}
            className='text-fg font-bold transition'
          />
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelBefore;
