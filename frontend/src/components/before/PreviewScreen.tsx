import { useEffect, useRef, useState } from 'react';
import { useLesson } from '../../context/LessonContext';
import LessonPreviewFretboard from './LessonPreviewFretboard';
import { TextBox } from '../TextBox';

export default function PreviewScreen() {
  const { startLesson } = useLesson();
  const [countdown, setCountdown] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleContinue = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setCountdown(3);
    } catch {
      alert('Microphone access is required to begin. Please check permissions.');
    }
  };

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) startLesson();
  }, [countdown, startLesson]);

  return (
    <div className="flex justify-center items-center w-full">
      {countdown === null ? (
        <LessonPreviewFretboard onContinue={handleContinue} />
      ) : (
        <TextBox
          width={20}
          height={3}
          content={[{ text: `starting in ${countdown}...`, className: 'text-fg font-bold' }]}
        />
      )}
    </div>
  );
}
