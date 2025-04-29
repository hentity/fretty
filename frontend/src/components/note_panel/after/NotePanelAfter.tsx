import { TextBox } from '../../../components/TextBox';
import { TextContainer } from '../../../components/TextContainer';
import { makeTextBlock } from '../../../styling/stylingUtils';

function NotePanelAfter() {
  const content = makeTextBlock([
    { text: 'See you tomorrow', className: 'text-fg font-bold' },
  ]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={18} height={12}>
        <div className="flex flex-col items-center justify-center w-full h-full border border-borderDebug">
          <TextBox
            width={16}
            height={3}
            content={content}
          />
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelAfter;
