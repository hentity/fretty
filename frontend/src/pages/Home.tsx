import { useLesson } from '../context/LessonContext'
import { useEffect, useState } from 'react';

import Before from '../components/before/Before'
import During from '../components/during/During'
import After from '../components/after/After'
import PreviewScreen from '../components/before/PreviewScreen'
import Tips from '../components/before/Tips'


const RESULT_COLORS: Record<string, string> = {
  easy: 'var(--color-easy)',
  good: 'var(--color-good)',
  hard: 'var(--color-hard)',
  fail: 'var(--color-fail)',
};

function Home() {
  const { lessonStatus, result, isFirstLesson } = useLesson()

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
        {lessonStatus === 'preview' && <PreviewScreen />}
        {lessonStatus === 'during' && <During />}
        {lessonStatus === 'after' && <After />}
      </div>

      {false && lessonStatus !== 'during' && (
        <div className="fixed bottom-0 w-full">
          <Tips />
        </div>
      )}
    </div>
  )
}

export default Home