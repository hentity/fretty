import { useState } from 'react'
import {
  LessonContext,
  LessonContextType,
  LessonStatus,
  PracticeResult,
} from './LessonContext'
import {
  todayISO,
  buildLesson,
  getNextRandomSpot,
  addAttempt,
  scheduleReview,
  pushBackReviews,
} from '../logic/lessonUtils'
import { Spot } from '../types'
import { useAuth } from './UserContext'
import useProgress from '../hooks/useProgress'

export const LessonProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const { progress, saveProgress } = useProgress(user)

  const [lessonStatus, setLessonStatus] = useState<LessonStatus>('before')
  const [lessonQueue,  setLessonQueue]  = useState<Spot[]>([])
  const [completed,    setCompleted]    = useState<Spot[]>([])
  const [currentSpot,  setCurrentSpot]  = useState<Spot | null>(null)
  const [result,       setResult]       = useState<PracticeResult>(null)
  const [dayOffset, setDayOffset] = useState(0)
  const today = todayISO(dayOffset)

  const startLesson = () => {
    if (!progress) return
    if (progress.last_review_date === today) {
      console.log("Cannot start lesson - you've already done one today")
      return
    }

    pushBackReviews(progress, today)

    // build today’s queue
    const lesson = buildLesson(progress, today)
    if (!lesson.length) {
      console.log('Nothing to review today')
      return
    }

    const [first, rest] = getNextRandomSpot(lesson)

    setLessonQueue(rest)
    setCompleted([])
    setCurrentSpot(first)
    setLessonStatus('during')

    saveProgress(progress)
  }

  const endLesson = (finalSpot: Spot) => {
    if (!progress) return
  
    progress.last_review_date = today
  
    // combine completed + the final spot manually (bc react async tomfoolery)
    const allCompleted = [...completed, finalSpot]
  
    // reschedule every completed spot
    allCompleted.forEach((spot) => {
      const days = Math.max(1, Math.round(spot.interval))
      scheduleReview(progress, spot, days, today)
    })
  
    // remove today’s bucket entirely (now empty)
    delete progress.review_date_to_spots[today]
  
    // persist updated progress
    saveProgress(progress)
  
    // reset local UI state
    setLessonStatus('after')
    setLessonQueue([])
    setCurrentSpot(null)
    setResult(null)
  }
  

  const advance = (newResult: PracticeResult) => {
    if (!currentSpot || newResult === null || !progress) return
  
    // update spot using result of practice attempt
    const updatedSpot = addAttempt({ ...currentSpot }, newResult)
    setResult(newResult)
  
    // update spot inside progress.spots
    const spotIndex = progress.spots.findIndex(
      (s) => s.string === updatedSpot.string && s.fret === updatedSpot.fret
    )
    if (spotIndex !== -1) {
      progress.spots[spotIndex] = updatedSpot
    }
  
    // requeue or complete
    let nextQueue = [...lessonQueue]

    if (updatedSpot.status === 'review') {
      setCompleted((prev) => [...prev, updatedSpot])
    } else {
      nextQueue.push(updatedSpot)
    }
  
    if (nextQueue.length === 0) {
      endLesson(updatedSpot)
    } else {
      const [next, rest] = getNextRandomSpot(nextQueue)
      setLessonQueue(rest)
      setCurrentSpot(next)
    }
  }
  
  

  const advanceDay = () => {
    console.log('Advanced one day. New offset: ' + (dayOffset + 1))
    setDayOffset((prev) => prev + 1)
    console.log(progress)
  }
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
  }

  return (
    <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
  )
}
