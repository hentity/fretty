import { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/UserContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, provider, db } from '../firebase'
import useProgress from '../hooks/useProgress'
import NoteDisplay from '../components/NoteDisplay'
import { createLesson } from '../logic/lessonUtils'
import { Spot } from '../types'
import { TimerHandle } from '../components/Timer'
import Timer from '../components/Timer'
import { addAttempt, getNextRandomSpot } from '../logic/lessonUtils'
import { createDefaultProgress } from './Auth'

function Home() {
  const { user, loading } = useContext(UserContext)

  const { progress, setProgress, saveProgress } = useProgress(user)
  const lessonStates = ['first', 'before', 'during', 'after', 'paused']
  const [lessonStatus, setLessonStatus] = useState('before')
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null)
  const [timerResult, setTimerResult] = useState('idle')
  const [lesson, setLesson] = useState<Spot[]>([])

  const timerRef = useRef<TimerHandle>(null);

  const handleResult = (result: 'easy' | 'good' | 'hard' | 'fail') => {
    if (!currentSpot || !progress) return
  
    addAttempt(currentSpot, result)
    setProgress({ ...progress })
  
    setLesson((prevLesson) => {
      const updated = [...prevLesson]
      if (currentSpot.status !== 'review') {
        updated.push(currentSpot)
      }
      console.log(updated)
      return updated
    })
  }

  const handleNext = () => {
    if (!currentSpot || !progress) return
  
    setLesson((prevLesson) => {
      if (prevLesson.length === 0) {
        setLessonStatus('after')
        setCurrentSpot(null)
        saveProgress(progress)
        return []
      }
  
      const [next, newQueue] = getNextRandomSpot(prevLesson)
      setCurrentSpot(next)
      timerRef.current?.start()
      return newQueue
    })

  }

  const cycleLessonStatus = () => {
    const currentIndex = lessonStates.indexOf(lessonStatus)
    const nextIndex = (currentIndex + 1) % lessonStates.length
    setLessonStatus(lessonStates[nextIndex])
  }

  const startLesson = () => {
    if (!progress) return

    const newLesson = createLesson(progress)
    setLesson(newLesson)

    if (newLesson.length > 0) {
      const first = newLesson.shift()
      setCurrentSpot(first ?? null)
      setLessonStatus('during')
    }
  }

  const resetProgress = async () => {
    if (!user) return
    const ref = doc(db, 'progress', user.uid)
    const defaultProgress = createDefaultProgress()
    await setDoc(ref, defaultProgress)
    setProgress(defaultProgress)
    setLessonStatus('before')
    setCurrentSpot(null)
    setLesson([])
    console.log('Progress reset to default.')
  }

  if (loading) return <p>Loading user...</p>

  return (
    <div className="flex flex-col min-h-screen items-center justify-center overflow-hidden">
      <div
        className="aspect-[21/9] w-[100vw] h-auto max-w-[1024px] max-h-[calc(1024px*(9/21))] border"
        style={{
          height: 'min(calc((100vw * 9 / 21)), calc(100vh - 4rem))',
        }}
      >
        <div className="flex w-full h-full">
          {/* Note Panel */}
          <div className="w-1/4 h-full flex flex-col justify-center m-1">
            <div className="flex-1 flex items-center justify-center m-1 border border-borderDebug">
              <NoteDisplay
                lessonStatus={lessonStatus}
                currentSpot={currentSpot}
                timerResult={timerResult}
                onStart={startLesson}
              />
            </div>
          </div>

          {/* Lesson Panel */}
          <div className="w-3/4 h-full flex justify-center m-1">
            <div className="flex w-full flex-col items-center justify-center m-1 border border-borderDebug">
              <Timer 
                ref={timerRef}
                totalTime={5000}
                easyTime={1700}
                goodTime={3000}
                onComplete={handleResult}
              />
              <button onClick={() => timerRef.current?.start()}>Start</button>
              <button onClick={() => timerRef.current?.stop()}>Stop</button>
              <button onClick={handleNext} className="mt-2 px-4 py-2 bg-secondary">Next</button>
              <button
                onClick={resetProgress}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug lessonStatus toggle */}
      <button
        onClick={cycleLessonStatus}
        className="mt-4 px-4 py-2 bg-primaryLight"
      >
        Next Lesson Status ({lessonStatus})
      </button>
    </div>
  )
}

export default Home
