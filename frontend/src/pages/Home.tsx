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
  const { lessonStatus, setLessonStatus, advanceDay } = useLesson()
  const { progress, setProgress, saveProgress } = useProgress(user)
  const [currentSpot, setCurrentSpot] = useState<Spot | null>(null)

  const lessonStates: LessonStatus[] = ['before', 'during', 'after']

  const cycleLessonStatus = () => {
    const currentIndex = lessonStates.indexOf(lessonStatus)
    const nextIndex = (currentIndex + 1) % lessonStates.length
    setLessonStatus(lessonStates[nextIndex])
  }

  const resetProgress = async () => {
    if (!saveProgress) return; // Make sure you have saveProgress function from useProgress
  
    const defaultProgress = createDefaultProgress();
  
    if (user) {
      // user is logged in -> reset in Firestore
      const ref = doc(db, 'progress', user.uid);
      await setDoc(ref, defaultProgress);
      console.log('Progress reset to default in Firestore.');
    } else {
      // guest user -> reset in localStorage
      try {
        localStorage.setItem('fretty_guest_progress', JSON.stringify(defaultProgress));
        console.log('Guest progress reset to default in localStorage.');
      } catch (err) {
        console.error('Failed to reset guest progress in localStorage.', err);
      }
    }
  
    // update app state too
    setProgress(defaultProgress);
    setLessonStatus('before');
    setCurrentSpot(null);
  };
  

  if (loading) return <p>Loading user...</p>
  return (
    <div className="flex flex-col min-h-screen items-center justify-center overflow-hidden">
        <div className="flex border border-borderDebug gap-2">
          {/* Note Panel */}
          <div className="h-full flex justify-center bg-stone-900">
              {lessonStatus === 'before' && (
                <NotePanelBefore />
              )}
              {lessonStatus === 'during' && (
                <NotePanelDuring/>
              )}
              {lessonStatus === 'after' && <NotePanelAfter />}
          </div>

          {/* Lesson Panel */}
          <div className="h-full flex justify-center bg-stone-900">
              {lessonStatus === 'before' && <LessonPanelBefore />}
              {lessonStatus === 'during' && (
                <LessonPanelDuring/>
              )}
              {lessonStatus === 'after' && <LessonPanelAfter />}
          </div>
      </div>

      {/* Debug lessonStatus toggle */}
      <div className='flex gap-2'>
      <button
        onClick={cycleLessonStatus}
        className="mt-4 px-4 py-2 bg-primaryLight hover:bg-gray-500 hover:cursor-pointer"
      >
        Next Lesson Status ({lessonStatus})
      </button>
      <button
        onClick={resetProgress}
        className="mt-4 px-4 py-2 bg-primaryLight hover:bg-gray-500 hover:cursor-pointer"
      >
        Reset Progress
      </button>
      <button
        onClick={advanceDay}
        className="mt-4 px-4 py-2 bg-primaryLight hover:bg-gray-500 hover:cursor-pointer"
      >
        Advance 1 Day
      </button>
      </div>
    </div>
  )
}

export default Home
