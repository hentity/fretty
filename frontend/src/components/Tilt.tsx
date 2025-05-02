import { useEffect, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { TextBox } from './TextBox';
import { makeTextBlock } from '../styling/stylingUtils';

export default function Tilt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isSmallScreen = window.innerWidth < 1024;
      setShowPrompt(isPortrait && isSmallScreen);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showPrompt) return null;

  const content = makeTextBlock([
    {
      text: 'Please tilt your device\n to landscape mode.\n\n',
      className: 'text-fg font-bold text-2xl',
    },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg text-center">
      <ArrowPathIcon className="h-10 w-10 text-fg" />
      <TextBox width={60} height={6} content={content} />
    </div>
  );
}
