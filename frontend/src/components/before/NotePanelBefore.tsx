import { useLesson } from '../../context/LessonContext';
import { useState, useEffect, useRef } from 'react';
import LessonPreviewFretboard from './LessonPreviewFretboard';

type Phase = 'idle' | 'preview' | 'countdown';

type Props = { onPreviewChange?: (active: boolean) => void };

function NotePanelBefore({ onPreviewChange }: Props) {
  const { startLesson, progress } = useLesson();
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
      {phase === 'idle' ? (
        <button
          onClick={handleStart}
          className="font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl text-fg border-2 border-fg px-8 py-3 rounded-md hover:bg-fg hover:text-bg active:brightness-75 transition cursor-pointer"
        >
          begin
        </button>
      ) : (
        <span className="font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl text-fg font-bold">
          starting in {remaining}...
        </span>
      )}
    </div>
  );
}

export default NotePanelBefore;
