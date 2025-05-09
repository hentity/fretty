import { useLesson } from '../../context/LessonContext';
import { useState, useEffect } from 'react';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';

function NotePanelBefore() {
  const { startLesson } = useLesson();
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [remaining, setRemaining] = useState(5);

  // countdown side-effect
  useEffect(() => {
    if (!countdownStarted || remaining <= 0) return;
  
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdownStarted, remaining]);

  const handleStart = () => {
    if (!countdownStarted) {
      setCountdownStarted(true);
      setRemaining(5);
    }
  };

  // after countdown ends, trigger mic + lesson
  if (countdownStarted && remaining <= 0) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => startLesson())
      .catch((err) => {
        console.error('Mic access denied or failed:', err);
        alert('Microphone access is required to begin. Please check browser permissions.');
      });
  }

  return (
    <div className="flex justify-center items-center w-full h-full">
      <TextContainer width={15} height={5}>
        <div className="flex flex-col items-right justify-center w-full h-full">
          {!countdownStarted ? (
            <TextBox
              width={15}
              height={3}
              content={makeTextBlock([
                { text: '⌜             ⌝\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
                { text: '    begin    \n', onClick: handleStart },
                { text: '⌞             ⌟\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
              ])}
              className='text-fg font-bold transition'
            />
          ) : (
            <TextBox
              width={20}
              height={3}
              content={[{ text: `Starting in ${remaining}...`, className: 'text-fg font-bold' }]}
            />
          )}
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelBefore;
