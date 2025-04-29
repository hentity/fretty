import React, { useEffect, useRef, useState } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../../components/TextBox';
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
  const { currentSpot, advance, lessonStatus, isPausing } = useLesson();
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const [failing, setFailing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  /* when a new spot starts */
  useEffect(() => {
    if (lessonStatus === 'during' && currentSpot) {
      setElapsed(0);
      setRunning(true);
      setFailing(false);
    } else {
      setRunning(false);
    }
  }, [currentSpot, lessonStatus]);

  /* update elapsed time ONLY when running and NOT pausing */
  useEffect(() => {
    if (!(running && !isPausing)) return;
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 0.1);
    }, 100);
    return () => clearInterval(intervalRef.current!);
  }, [running, isPausing]);

  /* when timer expires */
  useEffect(() => {
    if (!running || isPausing) return;
    if (elapsed >= totalTime) {
      setRunning(false);
      setFailing(true);
    }
  }, [elapsed, running, isPausing]);

  /* flashing if fail */
  useEffect(() => {
    if (!failing) return;
    const flashInterval = setInterval(() => {
      setFlashOn(f => !f);
    }, 300);
    const timeout = setTimeout(() => {
      clearInterval(flashInterval);
      setFailing(false);
      setFlashOn(false);
      advance('fail');
    }, 1200);
    return () => {
      clearInterval(flashInterval);
      clearTimeout(timeout);
    };
  }, [failing, advance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && running && !isPausing) {
        e.preventDefault();  // prevent scroll
        
        setRunning(false);   // stop timer immediately
        
        // read elapsed directly here
        let result: 'easy' | 'good' | 'hard';
        if (elapsed <= easyTime) result = 'easy';
        else if (elapsed <= goodTime) result = 'good';
        else result = 'hard';
        
        console.log(result);
        advance(result);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running, isPausing, elapsed, easyTime, goodTime, advance]);

  /* stop function */
  function stopEarly() {
    if (!running) return;
    setRunning(false);
    let result: 'easy' | 'good' | 'hard';
    if (elapsed <= easyTime) result = 'easy';
    else if (elapsed <= goodTime) result = 'good';
    else result = 'hard';
    console.log(result)
    advance(result);
  }

  /* build bar */
  const filled = Math.min(width, Math.round((elapsed / totalTime) * width));

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
        ? (flashOn ? 'text-fail' : 'text-bg')
        : color,
    });
  }

  const barChunks = makeTextBlock([...segments, { text: '\n' }]);

  return (
    <div className="flex flex-col items-center gap-2">
      <TextBox
        width={width}
        height={1}
        content={barChunks}
      />
    </div>
  );
}
