import { useState, useEffect, useCallback } from 'react';
import {
  LessonContext,
  LessonContextType,
  LessonStatus,
  PracticeResult,
  Highlight,
} from './LessonContext';
import {
  todayISO,
  buildLesson,
  getNextRandomSpot,
  addAttempt,
  scheduleReview,
  pushBackReviews,
} from '../logic/lessonUtils';
import { Progress, Spot } from '../types';
import { useAuth } from './UserContext';
import useProgress from '../hooks/useProgress';

export const LessonProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { progress: initialProgress, saveProgress } = useProgress(user);

  /* ------------------------------------------------------------------ */
  /*  core lesson state                                                 */
  /* ------------------------------------------------------------------ */
  const [progress, setProgress] = useState<Progress | null>(initialProgress);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('before');
  const [lessonQueue, setLessonQueue] = useState<Spot[]>([]);
  const [completed, setCompleted]     = useState<Spot[]>([]);
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null);
  const [result, setResult]           = useState<PracticeResult>(null);
  const [dayOffset, setDayOffset]     = useState(0);
  const today = todayISO(dayOffset);

  /* ------------------------------------------------------------------ */
  /*  flash/fretboard highlight state                                   */
  /* ------------------------------------------------------------------ */
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const highlightSpot = useCallback(
    (stringNo: number, fretNo: number, colourClass: string, duration = 800) => {
      setHighlight({ string: stringNo, fret: fretNo, className: colourClass });
      setTimeout(() => setHighlight(null), duration);
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  pause state for feedback after practice attempt                  */
  /* ------------------------------------------------------------------ */
  const [isPausing, setIsPausing] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  setup progress once loaded                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (initialProgress && !progress) {
      setProgress(initialProgress);
    }
  }, [initialProgress]);

  /* ------------------------------------------------------------------ */
  /*  start a new lesson                                                */
  /* ------------------------------------------------------------------ */
  const startLesson = () => {
    if (!progress) return;
    if (progress.last_review_date === today) {
      console.log('Already practised today');
      return;
    }

    pushBackReviews(progress, today);
    const lesson = buildLesson(progress, today);
    if (!lesson.length) {
      console.log('Nothing to review');
      return;
    }

    const [first, rest] = getNextRandomSpot(lesson);
    setLessonQueue(rest);
    setCompleted([]);
    setCurrentSpot(first);
    setLessonStatus('during');
    saveProgress(progress);
  };

  /* ------------------------------------------------------------------ */
  /*  end the lesson                                                    */
  /* ------------------------------------------------------------------ */
  const endLesson = (finalSpot: Spot) => {
    if (!progress) return;

    const updatedProgress = { ...progress, last_review_date: today };
    delete updatedProgress.review_date_to_spots[today];
    setProgress(updatedProgress);
    saveProgress(updatedProgress);

    setLessonStatus('after');
    setLessonQueue([]);
    setCurrentSpot(null);
    setResult(null);
  };

  /* ------------------------------------------------------------------ */
  /*  move to next spot, or end if none left                            */
  /* ------------------------------------------------------------------ */
  const goToNextOrEnd = (finalSpot: Spot, queue: Spot[]) => {
    if (!queue.length) {
      endLesson(finalSpot);
    } else {
      const [next, rest] = getNextRandomSpot(queue);
      setLessonQueue(rest);
      setCurrentSpot(next);
      setResult(null);
      setIsPausing(false); // resume timer
    }
  };

  /* ------------------------------------------------------------------ */
  /*  advance after a practice attempt                                 */
  /* ------------------------------------------------------------------ */
  const advance = (newResult: PracticeResult) => {
    if (!currentSpot || newResult === null || !progress) return;

    // update spot progress
    const updatedSpot = addAttempt({ ...currentSpot }, newResult);
    setResult(newResult);

    const newProgress: Progress = {
      ...progress,
      spots: progress.spots.map((s) =>
        s.string === updatedSpot.string && s.fret === updatedSpot.fret
          ? updatedSpot
          : s
      ),
    };
    setProgress(newProgress);
    saveProgress(newProgress);

    // flash on fretboard
    const colourMap = {
      easy: 'bg-easy',
      good: 'bg-good',
      hard: 'bg-hard',
      fail: 'bg-fail',
    } as const;

    highlightSpot(
      updatedSpot.string + 1,
      updatedSpot.fret, // fret assumed 1-based already
      colourMap[newResult]
    );

    // handle queue
    let nextQueue = [...lessonQueue];
    if (updatedSpot.status === 'review') {
      const days = Math.max(1, Math.round(updatedSpot.interval));
      scheduleReview(newProgress, updatedSpot, days, today);
      setCompleted((prev) => [...prev, updatedSpot]);
    } else {
      nextQueue.push(updatedSpot);
    }

    // pause before moving
    setIsPausing(true); // freeze timers

    setTimeout(() => goToNextOrEnd(updatedSpot, nextQueue), 800); // show feedback
  };

  /* ------------------------------------------------------------------ */
  /*  advance the day (for testing)                                     */
  /* ------------------------------------------------------------------ */
  const advanceDay = () => setDayOffset((d) => d + 1);

  /* ------------------------------------------------------------------ */
  /*  assemble context                                                  */
  /* ------------------------------------------------------------------ */
  const value: LessonContextType = {
    lessonStatus,
    setLessonStatus,
    lessonQueue,
    completedSpots: completed,
    currentSpot,
    result,
    startLesson,
    endLesson,
    advance,
    advanceDay,
    progress,
    highlight,
    highlightSpot,
    isPausing,
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};
