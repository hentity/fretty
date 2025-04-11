import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';

interface TimerProps {
  totalTime: number;
  easyTime: number;
  goodTime: number;
  onComplete: (result: 'easy' | 'good' | 'hard' | 'fail') => void;
}

export interface TimerHandle {
  start: () => void;
  stop: () => void;
}

const Timer = forwardRef<TimerHandle, TimerProps>(
  ({ totalTime, easyTime, goodTime, onComplete }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [running, setRunning] = useState(false);
    const [flash, setFlash] = useState(false);
    const [barLength, setBarLength] = useState(50);
    const hasCompletedRef = useRef(false);
    const [result, setResult] = useState<'easy' | 'good' | 'hard' | 'fail' | null>(null);

    // Setup bar size on mount and resize
    useEffect(() => {
      const updateBarLength = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          const maxBlocks = Math.floor(width / 10);
          setBarLength(Math.max(10, maxBlocks));
        }
      };
      updateBarLength();
      window.addEventListener('resize', updateBarLength);
      return () => window.removeEventListener('resize', updateBarLength);
    }, []);

    // Effect to run timer
    useEffect(() => {
      if (!running) return;

      hasCompletedRef.current = false;
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const next = prev + 100;
          if (next >= totalTime) {
            stopTimer(true);
            return totalTime;
          }
          return next;
        });
      }, 100);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [running]);

    // Imperative methods
    useImperativeHandle(ref, () => ({
      start: () => {
        if (!running) {
          setElapsedTime(0);
          setRunning(true);
          setFlash(false);
          setResult(null);
          hasCompletedRef.current = false;
        }
      },
      stop: () => {
        if (running) stopTimer(false);
      },
    }));

    const stopTimer = (fromTimeout: boolean) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        const timerResult = getResult(elapsedTime, easyTime, goodTime, fromTimeout);
        setResult(timerResult);
        if (timerResult === 'fail') triggerFlash();
        onComplete(timerResult);
      }
    };

    const getResult = (
      time: number,
      easy: number,
      good: number,
      timeout: boolean
    ): 'easy' | 'good' | 'hard' | 'fail' => {
      if (timeout) return 'fail';
      if (time <= easy) return 'easy';
      if (time <= good) return 'good';
      return 'hard';
    };

    const triggerFlash = () => {
      let count = 0;
      setFlash(true);
      const flashInterval = setInterval(() => {
        count++;
        setFlash((prev) => !prev);
        if (count >= 4) {
          clearInterval(flashInterval);
          setFlash(false);
        }
      }, 200);
    };

    const progressRatio = elapsedTime / totalTime;
    const filled = Math.round(progressRatio * barLength);

    const blocks = Array.from({ length: barLength }, (_, i) => {
      const char = i < filled ? '▰' : '▱';
      const pct = i / barLength;
    
      let colorClass: string;
    
      if (result === 'fail') {
        colorClass = 'text-red-500';
      } else {
        if (pct < easyTime / totalTime) colorClass = 'text-easy';
        else if (pct < goodTime / totalTime) colorClass = 'text-good';
        else colorClass = 'text-hard';
      }
    
      return (
        <span
          key={i}
          className={`${colorClass} ${flash ? 'opacity-0' : 'opacity-100'} transition-opacity duration-100`}
        >
          {char}
        </span>
      );
    });

    return (
      <div
        ref={containerRef}
        className="w-full text-center overflow-hidden"
        style={{
          fontFamily: 'monospace',
          fontSize: '1rem',
          whiteSpace: 'nowrap',
        }}
      >
        {blocks}
      </div>
    );
  }
);

export default Timer;
