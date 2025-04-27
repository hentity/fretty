import { useState, useEffect } from 'react';
import {
  LessonContext,
  LessonContextType,
  LessonStatus,
  PracticeResult,
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
  const [progress, setProgress] = useState<Progress | null>(initialProgress);
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('before');
  const [lessonQueue, setLessonQueue] = useState<Spot[]>([]);
  const [completed, setCompleted] = useState<Spot[]>([]);
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null);
  const [result, setResult] = useState<PracticeResult>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const today = todayISO(dayOffset);

  useEffect(() => {
    if (initialProgress && !progress) {
      setProgress(initialProgress);
    }
  }, [initialProgress]); // if progress loaded after first render

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const startLesson = () => {
    if (!progress) return;
    if (progress.last_review_date === today) {
      console.log("Cannot start lesson - you've already done one today");
      return;
    }

    pushBackReviews(progress, today);

    const lesson = buildLesson(progress, today);
    if (!lesson.length) {
      console.log('Nothing to review today');
      return;
    }

    const [first, rest] = getNextRandomSpot(lesson);

    setLessonQueue(rest);
    setCompleted([]);
    setCurrentSpot(first);
    setLessonStatus('during');

    saveProgress(progress); // optional if you want to persist immediately
  };

  const endLesson = (finalSpot: Spot) => {
    if (!progress) return;

    const updatedProgress = {
      ...progress,
      last_review_date: today,
    };

    delete updatedProgress.review_date_to_spots[today];

    setProgress(updatedProgress);
    saveProgress(updatedProgress);

    setLessonStatus('after');
    setLessonQueue([]);
    setCurrentSpot(null);
    setResult(null);
  };

  const advance = async (newResult: PracticeResult) => {
    if (!currentSpot || newResult === null || !progress) return;

    const updatedSpot = addAttempt({ ...currentSpot }, newResult);
    setResult(newResult);

    const newProgress: Progress = {
      ...progress,
      spots: progress.spots.map(spot =>
        spot.string === updatedSpot.string && spot.fret === updatedSpot.fret
          ? updatedSpot
          : spot
      ),
    };

    let nextQueue = [...lessonQueue];

    if (updatedSpot.status === 'review') {
      const days = Math.max(1, Math.round(updatedSpot.interval));
      scheduleReview(newProgress, updatedSpot, days, today);
      setCompleted(prev => [...prev, updatedSpot]);
    } else {
      nextQueue.push(updatedSpot);
    }

    setProgress(newProgress);
    saveProgress(newProgress);

    setCurrentSpot(updatedSpot);
    await sleep(1000);

    if (nextQueue.length === 0) {
      endLesson(updatedSpot);
    } else {
      const [next, rest] = getNextRandomSpot(nextQueue);
      setLessonQueue(rest);
      setCurrentSpot(next);
      setResult(null); // clear the result message after moving
    }
  };

  const advanceDay = () => {
    console.log('Advanced one day. New offset: ' + (dayOffset + 1));
    setDayOffset(prev => prev + 1);
    console.log(progress);
  };

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
  };

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
};
