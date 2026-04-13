import { useLesson } from '../../context/LessonContext';
import { useState, useEffect, useRef } from 'react';
import LessonPreviewFretboard from './LessonPreviewFretboard';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';

type Phase = 'idle' | 'preview' | 'countdown';

type Props = { onPreviewChange?: (active: boolean) => void };

function NotePanelBefore({ onPreviewChange }: Props) {
  const { startLesson, prepareLesson, progress } = useLesson();
  const [phase, setPhase]         = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(3);
  const streamRef = useRef<MediaStream | null>(null);

  // notify parent when entering/leaving preview
  useEffect(() => {
    onPreviewChange?.(phase !== 'idle');
  }, [phase, onPreviewChange]);

  // skip preview for the very first lesson (tutorial flow)
  const isFirstLesson = progress?.spots.every(s => s.is_new) ?? false;

  useEffect(() => {
    if (phase !== 'countdown' || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, remaining]);

  useEffect(() => {
    if (phase === 'countdown' && remaining <= 0) {
      startLesson();
    }
  }, [phase, remaining, startLesson]);

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setRemaining(3);
      if (!isFirstLesson) prepareLesson();
      setPhase(isFirstLesson ? 'countdown' : 'preview');
    } catch (err) {
      console.error('Mic access denied or failed:', err);
      alert('Microphone access is required to begin. Please check permissions.');
    }
  };

  const handleContinue = () => {
    setRemaining(3);
    setPhase('countdown');
  };

  if (phase === 'preview') {
    return (
      <div className="flex justify-center items-center w-full">
        <LessonPreviewFretboard onContinue={handleContinue} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <TextContainer width={15} height={5}>
        <div className="flex flex-col items-center justify-center w-full h-full">
          {phase === 'idle' ? (
            <TextBox
              width={15}
              height={3}
              content={makeTextBlock([
                { text: '⌜             ⌝\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
                { text: '    begin    \n', onClick: handleStart },
                { text: '⌞             ⌟\n', onClick: handleStart, className: 'group-active:text-easy group-hover:text-easy transition' },
              ])}
              className="text-fg font-bold transition"
            />
          ) : (
            <TextBox
              width={20}
              height={3}
              content={[{ text: `starting in ${remaining}...`, className: 'text-fg font-bold' }]}
            />
          )}
        </div>
      </TextContainer>
    </div>
  );
}

export default NotePanelBefore;
