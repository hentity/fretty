import React, { useEffect, useRef, useState } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';

/** default times (seconds) */
const DEFAULT_TOTAL = 5;
const DEFAULT_EASY  = 2;
const DEFAULT_GOOD  = 3;

type Props = {
  totalTime?: number;
  easyTime?:  number;
  goodTime?:  number;
  width?:     number;
};

export default function TimerBar({
  totalTime = DEFAULT_TOTAL,
  easyTime  = DEFAULT_EASY,
  goodTime  = DEFAULT_GOOD,
  width     = 52,
}: Props) {
  const { lessonStep, advance, lessonStatus, isPausing, isFirstLesson } = useLesson();
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [failing, setFailing] = useState(false);

  /* when a new spot starts */
  useEffect(() => {
    if (lessonStatus === 'during' && !isFirstLesson) {
      setElapsed(0);
      setRunning(true);
      setFailing(false);
    } else {
      setRunning(false);
    }
  }, [lessonStep, lessonStatus, isFirstLesson]);

  /* update elapsed time ONLY when running and NOT pausing */
  useEffect(() => {
    if (!(running && !isPausing)) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 0.1;
        elapsedRef.current = next;
        return next;
      });
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [running, isPausing]);

  /* when timer expires */
  useEffect(() => {
    if (!running || isPausing) return;
    if (elapsed >= totalTime) {
      setRunning(false);
      setFailing(true);
      advance('fail'); // <-- move it here, guaranteed to run only once
    }
  }, [elapsed, running, totalTime, isPausing, advance]);

  const filled = Math.min(width, Math.round((elapsed / totalTime) * width));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInitial = isFirstLesson && lessonStep === 0;

      if (e.code === 'Space' && (running || isInitial) && !isPausing) {
        e.preventDefault();

        if (isInitial) {
          console.log('tutorial step — advancing without recording');
          setRunning(false);
          advance(null); // pass null to skip recording attempt
          return;
        }
  
        // derive result from which segment was most recently filled
        const segmentIndex = Math.max(0, filled - 1); // avoid -1
        const secAt = (segmentIndex / width) * totalTime;
  
        let result: 'easy' | 'good' | 'hard';
        if (secAt <= easyTime) result = 'easy';
        else if (secAt <= goodTime) result = 'good';
        else result = 'hard';
  
        setRunning(false);
        console.log(result);
        advance(result);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running, isPausing, filled, width, totalTime, easyTime, goodTime, advance]);
  

  /* build bar */

  const segments = [];
  for (let i = 0; i < width; i++) {
    let secAt = (i / width) * totalTime;
    let color: string;
    if (secAt <= easyTime) color = 'text-easy';
    else if (secAt <= goodTime) color = 'text-good';
    else color = 'text-hard';

    segments.push({
      text: i < filled ? '▰' : '▱',
      className: failing
        ? 'text-fail'
        : color,
    });

  }

  const listeningLabel = (running || isFirstLesson) ? {text: '\nlistening...', className: 'text-fg'} : {text: '\n'}
  segments.push(listeningLabel)

  const barChunks = makeTextBlock([...segments, { text: '' }]);

  return (
    <div className="flex flex-col items-center gap-2">
      <TextBox
        width={width}
        height={2}
        content={barChunks}
      />
    </div>
  );
}
