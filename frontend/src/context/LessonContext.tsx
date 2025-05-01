import { createContext, useContext } from 'react'
import { Spot, Progress } from '../types'

export type LessonStatus = 'before' | 'during' | 'after'
export type PracticeResult = 'easy' | 'good' | 'hard' | 'fail' | null
export type Highlight = { string: number; fret: number; className: string };

export type LessonContextType = {
  lessonStatus: LessonStatus;
  setLessonStatus: React.Dispatch<React.SetStateAction<LessonStatus>>;
  lessonQueue: Spot[];
  lessonStep: number;
  completedSpots: Spot[];
  currentSpot: Spot | null;
  result: PracticeResult;
  startLesson: () => void;
  endLesson: (finalSpot: Spot) => void;
  advance: (newResult: PracticeResult) => void;
  advanceDay: () => void;
  progress: Progress | null; // <--- Add this line
  highlight: Highlight | null;
  highlightSpot: (stringNo: number, fretNo: number, colourClass: string, duration?: number) => void;
  isPausing: boolean;
  isFirstLesson: boolean | null;
  tutorialStep: number;
  setTutorialStep: React.Dispatch<React.SetStateAction<number>>;
};

export const LessonContext = createContext<LessonContextType | undefined>(undefined)

export const useLesson = () => {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within a LessonProvider')
  return ctx
}
