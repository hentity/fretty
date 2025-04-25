import { useState, useEffect, useContext, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, provider, db } from '../firebase'
import { createDefaultProgress } from '../logic/progressUtils'
import useProgress from '../hooks/useProgress'
import { UserContext } from '../context/UserContext'
import { useLesson, LessonStatus } from '../context/LessonContext'
import  { Spot } from '../types'

import NotePanelBefore from '../components/note_panel/before/NotePanelBefore'
import NotePanelDuring from '../components/note_panel/during/NotePanelDuring'
import NotePanelAfter from '../components/note_panel/after/NotePanelAfter'

import LessonPanelBefore from '../components/lesson_panel/before/LessonPanelBefore'
import LessonPanelDuring from '../components/lesson_panel/during/LessonPanelDuring'
import LessonPanelAfter from '../components/lesson_panel/after/LessonPanelAfter'

function Home() {
  const { user, loading } = useContext(UserContext)
  const { lessonStatus, setLessonStatus, startLesson } = useLesson()
  const { progress, setProgress, saveProgress } = useProgress(user)
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null)

  const lessonStates: LessonStatus[] = ['before', 'during', 'after']

  const cycleLessonStatus = () => {
    const currentIndex = lessonStates.indexOf(lessonStatus)
    const nextIndex = (currentIndex + 1) % lessonStates.length
    setLessonStatus(lessonStates[nextIndex])
  }

  const resetProgress = async () => {
    if (!user) return
    const ref = doc(db, 'progress', user.uid)
    const defaultProgress = createDefaultProgress()
    await setDoc(ref, defaultProgress)
    setProgress(defaultProgress)
    setLessonStatus('before')
    setCurrentSpot(null)
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
              {lessonStatus === 'before' && (
                <NotePanelBefore />
              )}
              {lessonStatus === 'during' && (
                <NotePanelDuring lessonStatus={lessonStatus}/>
              )}
              {lessonStatus === 'after' && <NotePanelAfter />}
            </div>
          </div>

          {/* Lesson Panel */}
          <div className="w-3/4 h-full flex justify-center m-1">
            <div className="flex w-full flex-col items-center justify-center m-1 border border-borderDebug">
              {lessonStatus === 'before' && <LessonPanelBefore />}
              {lessonStatus === 'during' && (
                <LessonPanelDuring/>
              )}
              {lessonStatus === 'after' && <LessonPanelAfter />}
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
      <button
        onClick={resetProgress}
        className="mt-4 px-4 py-2 bg-primaryLight"
      >
        Reset Progress
      </button>
    </div>
  )
}

export default Home
