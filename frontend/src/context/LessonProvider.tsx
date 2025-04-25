import { useState, useEffect } from 'react'
import { LessonContext, LessonContextType, LessonStatus, PracticeResult } from './LessonContext'
import { Spot } from '../types'
import { useAuth } from './UserContext'
import useProgress from '../hooks/useProgress'
import { buildLesson, getNextRandomSpot, addAttempt } from '../logic/lessonUtils'

export const LessonProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const { progress, setProgress, saveProgress } = useProgress(user)

  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('before')
  const [lessonQueue, setLessonQueue] = useState<Spot[]>([])
  const [completedSpots, setCompletedSpots] = useState<Spot[]>([])
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null)
  const [result, setResult] = useState<PracticeResult>(null)

  const startLesson = () => {
    if (!progress) {
      return
    }
    const lesson = buildLesson(progress)
    const [first, rest] = getNextRandomSpot(lesson)

    setLessonQueue(rest)
    setCompletedSpots([])
    setCurrentSpot(first)
    setLessonStatus('during')
  }

  const endLesson = () => {
    if (!progress) return

    const updatedSpots = [...completedSpots]
    const fullProgress = {
      ...progress,
      spots: progress.spots.map((spot) => {
        const updated = updatedSpots.find(
          (s) => s.string === spot.string && s.fret === spot.fret
        )
        return updated ?? spot
      }),
    }

    saveProgress(fullProgress)

    setLessonStatus('after')
    setLessonQueue([])
    setCurrentSpot(null)
    setResult(null)
  }

  const advance = (newResult: PracticeResult) => {
    if (!currentSpot || newResult === null) return
  
    const updatedSpot = addAttempt({ ...currentSpot }, newResult)
    setResult(newResult)
  
    if (updatedSpot.status === 'review') {
      setCompletedSpots(prev => [...prev, updatedSpot])
      if (lessonQueue.length === 0) {
        endLesson()
      } else {
        const [next, rest] = getNextRandomSpot(lessonQueue)
        setLessonQueue(rest)
        setCurrentSpot(next)
      }
    } else {
      setLessonQueue(prev => {
        const newQueue = [...prev, updatedSpot]
  
        if (newQueue.length === 0) {
          endLesson()
          return []
        }
  
        const [next, rest] = getNextRandomSpot(newQueue)
        setCurrentSpot(next)
        return rest
      })
    }
  }
  

  useEffect(() => {
    console.log('Updated lessonQueue:', lessonQueue)
  }, [lessonQueue])
  
  useEffect(() => {
    console.log('Updated completedSpots:', completedSpots)
  }, [completedSpots])

  const value: LessonContextType = {
    lessonStatus,
    setLessonStatus,
    lessonQueue,
    completedSpots,
    currentSpot,
    result,
    startLesson,
    endLesson,
    advance,
  }

  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  )
}
