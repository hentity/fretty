import { Link } from 'react-router-dom'
import { useLesson } from '../context/LessonContext'
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

import Before from '../components/before/Before'
import During from '../components/during/During'
import After from '../components/after/After'


const RESULT_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  good: 'var(--color-good)',
  hard: 'var(--color-hard)',
  fail: 'var(--color-fail)',
};

function Home() {
  const { lessonStatus, result, isFirstLesson } = useLesson()

  const isWeb = Capacitor.getPlatform() === 'web';

  const [flashKey, setFlashKey] = useState(0);
  const [flashColor, setFlashColor] = useState('transparent');

  useEffect(() => {
    if (result === 'fail' && !isFirstLesson && lessonStatus === 'during') {
      setFlashColor(RESULT_COLORS[result]);
      setFlashKey(k => k + 1);
    }
  }, [result, isFirstLesson, lessonStatus]);

  return (
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden relative">
      {flashKey > 0 && (
        <div
          key={flashKey}
          className="fixed inset-0 pointer-events-none animate-result-flash"
          style={{ backgroundColor: flashColor }}
        />
      )}
      <div className="flex items-center justify-center w-full h-full">
        {lessonStatus === 'before' && <Before />}
        {lessonStatus === 'during' && <During />}
        {lessonStatus === 'after' && <After />}
      </div>

      {/* about / donate buttons */}
      {lessonStatus !== 'during' && isWeb && 
      <div className="fixed bottom-2 font-mono text-fg text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl brightness-80 flex gap-1 items-center">
        <Link
          to="/about"
          className="hover:underline transition leading-tight"
          aria-label="about"
        >
          about
        </Link>
        <span>|</span>
        <a
          href="https://github.com/hentity/fretty"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition leading-tight"
          aria-label="github"
        >
          github
        </a>
        <span>|</span>
        <a
          href="https://buymeacoffee.com/hhame4g"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition leading-tight"
          aria-label="support"
        >
          support
        </a>
      </div>
      }
    </div>
  )
}

export default Home