import { createContext, useContext } from 'react'
import { Spot } from '../types'

export type LessonStatus = 'before' | 'during' | 'after'
export type PracticeResult = 'easy' | 'good' | 'hard' | 'fail' | null

export type LessonContextType = {
  lessonStatus: LessonStatus
  setLessonStatus: (status: LessonStatus) => void
  lessonQueue: Spot[]
  completedSpots: Spot[]
  currentSpot: Spot | null
  result: PracticeResult
  startLesson: () => void
  endLesson: () => void
  advance: (result: PracticeResult) => void
  advanceDay: () => void
}

export const LessonContext = createContext<LessonContextType | undefined>(undefined)

export const useLesson = () => {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used within a LessonProvider')
  return ctx
}
