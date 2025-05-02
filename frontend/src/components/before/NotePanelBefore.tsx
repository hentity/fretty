import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';

async function requestMicAccess(): Promise<boolean> {
  try {
    const permission = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
    if (permission?.state === 'denied') {
      alert('Microphone access has been denied. Please enable it in browser settings.');
      return false;
    }

    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (err) {
    console.error('Failed to get mic permission:', err);
    return false;
  }
}

function NotePanelBefore() {
  const { startLesson } = useLesson();

  const handleStart = async () => {
    const granted = await requestMicAccess();
    if (granted) {
      startLesson(); 
    }
  };

  const buttonContent = makeTextBlock([
    { text: '⌜             ⌝\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
    { text: '    begin    \n', onClick: handleStart, className: '' },
    { text: '⌞             ⌟\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
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
