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
  buildTutorial,
} from '../logic/lessonUtils';
import { Progress, Spot } from '../types';
import { useAuth } from './UserContext';
import useProgress from '../hooks/useProgress';

export const LessonProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { progress: initialProgress, loading, saveProgress } = useProgress(user);

  /* ------------------------------------------------------------------ */
  /*  core lesson state                                                 */
  /* ------------------------------------------------------------------ */
  const [progress, setProgress] = useState<Progress | null>(initialProgress);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('before');
  const [lessonStep, setLessonStep] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [lessonQueue, setLessonQueue] = useState<Spot[]>([]);
  const [tutorialQueue, setTutorialQueue] = useState<Spot[]>([]);
  const [completed, setCompleted]     = useState<Spot[]>([]);
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null);
  const [result, setResult]           = useState<PracticeResult>(null);
  const [dayOffset, setDayOffset]     = useState(0);
  const today = todayISO(dayOffset);
  const [isFirstLesson, setIsFirstLesson] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  flash/fretboard highlight state                                   */
  /* ------------------------------------------------------------------ */
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const highlightSpot = useCallback(
    (stringNo: number, fretNo: number, colourClass: string, duration = 1500) => {
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
    if (initialProgress) {
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

    if (progress.spots.every((s) => s.is_new)) {
      setIsFirstLesson(true);
      setTutorialStep(0);
      const [firstTutorial, ...restTutorial] = buildTutorial(progress)
      setCurrentSpot(firstTutorial)
      setTutorialQueue(restTutorial);
      setProgress(progress);
      setLessonStatus('during');
    } else {
      const [first, rest] = getNextRandomSpot(lesson);
      setLessonQueue(rest);
      setCompleted([]);
      setCurrentSpot(first);
      setLessonStatus('during');
      setProgress(progress);
      setIsFirstLesson(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  end the lesson                                                    */
  /* ------------------------------------------------------------------ */
  const endLesson = (finalSpot: Spot) => {
    if (!progress) return;

    const updatedProgress: Progress = {
      ...progress,
      new: false,
      last_review_date: today,
      spots: progress.spots.map((s) =>
        s.string === finalSpot.string && s.fret === finalSpot.fret
          ? finalSpot
          : s
      ),
    };
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
      const [next, rest] = getNextRandomSpot(queue, currentSpot?.note[0]);
      setLessonQueue(rest);
      setLessonStep((prev) => prev + 1);
      setCurrentSpot(next);
      setResult(null);
      setIsPausing(false); // resume timer
    }
  };

  /* ------------------------------------------------------------------ */
  /*  advance after a practice attempt                                 */
  /* ------------------------------------------------------------------ */
  const advance = (newResult: PracticeResult) => {
    if (!currentSpot || !progress) return;
  
    if (newResult === null && isFirstLesson) {
      // get next from the current queue
      const [next, ...rest] = tutorialQueue;
    
      // re-add the current spot to the end
      rest.push(currentSpot);
    
      setTutorialQueue(rest);
      setCurrentSpot(next);
      setResult(null);
      setIsPausing(false);
    
      if (tutorialStep >= 5) {
        const lesson = buildLesson(progress, today);
        if (!lesson.length) {
          console.log('Nothing to review');
          return;
        }
        setLessonStep((prev) => prev + 1);
        const [first, rest] = getNextRandomSpot(lesson);
        setLessonQueue(rest);
        setCompleted([]);
        setCurrentSpot(first);
        setLessonStatus('during');
        setProgress(progress);
        setIsFirstLesson(false);
      }
      setTutorialStep((step) => step + 1);
      return;
    }
    
  
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
    setCurrentSpot(updatedSpot);
    setProgress(newProgress);
    // saveProgress(newProgress);
  
    // flash on fretboard
    const colourMap = {
      easy: 'bg-easy',
      good: 'bg-good',
      hard: 'bg-hard',
      fail: 'bg-fail',
    } as const;
  
    if (newResult) {
      highlightSpot(
        updatedSpot.string + 1,
        updatedSpot.fret,
        colourMap[newResult]
      );
    }
  
    // handle queue
    const nextQueue = [...lessonQueue];
    if (updatedSpot.status === 'review') {
      const days = Math.max(1, Math.round(updatedSpot.interval));
      scheduleReview(newProgress, updatedSpot, days, today);
      setCompleted((prev) => [...prev, updatedSpot]);
    } else {
      nextQueue.push(updatedSpot);
    }
  
    // pause before moving
    setIsPausing(true);
  
    setTimeout(() => goToNextOrEnd(updatedSpot, nextQueue), 1500);
  };

  /* ------------------------------------------------------------------ */
  /*  show fail                                                         */
  /* ------------------------------------------------------------------ */
  const showFail = () => {
    if (!currentSpot) return;
  
    setResult('fail')
    currentSpot.good_attempts = 0
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
    lessonStep,
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
    isFirstLesson,
    tutorialStep,
    setTutorialStep,
    today,
    loading,
    showFail,
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};
