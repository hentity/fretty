import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
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
import { schedulePracticeReminders } from '../logic/reminderUtils';

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
  const [tutorialAllowNext, setTutorialAllowNext] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  flash/fretboard highlight state                                   */
  /* ------------------------------------------------------------------ */
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const highlightSpot = useCallback(
    (stringNo: number, fretNo: number, colourClass: string, duration = 2500) => {
      setHighlight({ string: stringNo, fret: fretNo, className: colourClass });
      setTimeout(() => setHighlight(null), duration);
    },
    []
  );

  /* ------------------------------------------------------------------ */
  /*  pause state for feedback after practice attempt                  */
  /* ------------------------------------------------------------------ */
  const [isPausing, setIsPausing] = useState(false);
  const [postLessonProgress, setPostLessonProgress] = useState<Progress | null>(null);
  const [isPracticeAgain, setIsPracticeAgain] = useState(false);
  const [postPractice, setPostPractice] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  setup progress once loaded                                        */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (initialProgress) {
      setProgress(initialProgress);
    }
  }, [initialProgress]);
  
  /* ------------------------------------------------------------------ */
  /*  pending lesson state (computed once, used by preview + start)    */
  /* ------------------------------------------------------------------ */
  const [pendingLesson, setPendingLesson] = useState<Spot[]>([]);
  const [pendingReviewKeys, setPendingReviewKeys] = useState<Set<string>>(new Set());

  /* ------------------------------------------------------------------ */
  /*  prepare lesson — runs once when user clicks begin                */
  /* ------------------------------------------------------------------ */
  const prepareLesson = () => {
    if (!progress) return;
    if (progress.last_review_date === today) return;

    pushBackReviews(progress, today);

    // capture which keys are reviews BEFORE buildLesson sets them all to 'learning'
    const reviewKeys = new Set<string>(progress.review_date_to_spots[today] ?? []);
    setPendingReviewKeys(reviewKeys);

    const lesson = buildLesson(progress, today);
    setPendingLesson(lesson);
    setProgress({ ...progress }); // reflect pushBackReviews mutation
  };

  /* ------------------------------------------------------------------ */
  /*  start a new lesson — uses pre-computed pending lesson            */
  /* ------------------------------------------------------------------ */
  const startLesson = () => {
    if (!progress) return;
    if (progress.last_review_date === today) {
      console.log('Already practised today');
      return;
    }

    if (progress.new && progress.spots.every((s) => s.is_new)) {
      setIsFirstLesson(true);
      setTutorialStep(0);
      const [firstTutorial, ...restTutorial] = buildTutorial(progress)
      setCurrentSpot(firstTutorial)
      setTutorialQueue(restTutorial);
      setProgress(progress);
      setLessonStatus('during');
    } else {
      if (!pendingLesson.length) {
        console.log('Nothing to review');
        return;
      }
      const [first, rest] = getNextRandomSpot(pendingLesson);
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
  const endLesson = async (finalSpot: Spot) => {
    if (!progress) return;

    if (isPracticeAgain) {
      if (postLessonProgress) setProgress(postLessonProgress);
      setIsPracticeAgain(false);
      setPostPractice(true);
      setLessonQueue([]);
      setCurrentSpot(null);
      setResult(null);
      setLessonStatus('after');
      return;
    }

    const isWeb = Capacitor.getPlatform() === 'web';

    const updatedProgress: Progress = {
      ...progress,
      new: false,
      recentSpots: completed.some(
        (s) => s.string === finalSpot.string && s.fret === finalSpot.fret
      )
        ? completed
        : [...completed, finalSpot],
      last_review_date: today,
      spots: progress.spots.map((s) =>
        s.string === finalSpot.string && s.fret === finalSpot.fret
          ? finalSpot
          : s
      ),
    };
    delete updatedProgress.review_date_to_spots[today];
    setProgress(updatedProgress);
    await saveProgress(updatedProgress); // wait for save to complete

    // Schedule notifications (on ios only)
    if (!isWeb) {
      await schedulePracticeReminders();
    }

    if (isWeb) {
      window.location.href = '/'; // refresh necessary to remove mic icon
    } else {
      setLessonStatus('after');
      setLessonQueue([]);
      setCurrentSpot(null);
      setResult(null);
    }
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
      setTutorialAllowNext(false);
    
      if (tutorialStep >= 5) {
        // Tutorial done — prepare the first real lesson and show preview
        const tutorialDoneProgress = { ...progress, new: false };
        pushBackReviews(tutorialDoneProgress, today);
        const reviewKeys = new Set<string>(tutorialDoneProgress.review_date_to_spots[today] ?? []);
        setPendingReviewKeys(reviewKeys);
        const lesson = buildLesson(tutorialDoneProgress, today);
        setPendingLesson(lesson);
        setProgress({ ...tutorialDoneProgress });
        setIsFirstLesson(false);
        setLessonStatus('preview');
        setTutorialStep((step) => step + 1);
        return;
      }
      setTutorialStep((step) => step + 1);
      return;
    }
    
  
    // update spot progress
    const updatedSpot = addAttempt({ ...currentSpot }, newResult, isPracticeAgain);
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
  
    setTimeout(() => goToNextOrEnd(updatedSpot, nextQueue), 2500);
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
  /*  practice again (no save)                                         */
  /* ------------------------------------------------------------------ */
  const practiceAgain = (preselected: Spot[]) => {
    if (!progress) return;

    setPostLessonProgress(JSON.parse(JSON.stringify(progress)));

    const practiceSpots = preselected.map(
      (s: Spot) => ({ ...s, good_attempts: 0, status: 'learning' as const })
    );

    const [first, ...rest] = practiceSpots;
    setCurrentSpot(first);
    setLessonQueue(rest);
    setCompleted([]);
    setResult(null);
    setLessonStep(0);
    setIsPausing(false);
    setIsFirstLesson(false);
    setIsPracticeAgain(true);
    setLessonStatus('during');
  };

  /* ------------------------------------------------------------------ */
  /*  auto-reset to 'before' when app returns to foreground            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const checkReset = () => {
      if (document.visibilityState !== 'visible') return;
      const currentToday = todayISO(dayOffset);
      if (lessonStatus === 'after' && progress?.last_review_date !== currentToday) {
        setLessonStatus('before');
        setLessonQueue([]);
        setCurrentSpot(null);
        setResult(null);
      }
    };

    document.addEventListener('visibilitychange', checkReset);
    return () => document.removeEventListener('visibilitychange', checkReset);
  }, [lessonStatus, progress?.last_review_date, dayOffset]);

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
    prepareLesson,
    pendingLesson,
    pendingReviewKeys,
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
    tutorialQueue,
    today,
    loading,
    showFail,
    tutorialAllowNext,
    setTutorialAllowNext,
    practiceAgain,
    isPracticeAgain,
    postPractice,
    setPostPractice,
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};
