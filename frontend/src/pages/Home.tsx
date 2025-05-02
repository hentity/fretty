import { useState, useEffect, useContext, useRef } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, provider, db } from '../firebase'
import { createDefaultProgress } from '../logic/progressUtils'
import useProgress from '../hooks/useProgress'
import { UserContext } from '../context/UserContext'
import { useLesson, LessonStatus } from '../context/LessonContext'
import  { Spot } from '../types'

import NotePanelBefore from '../components/before/NotePanelBefore'
import NotePanelDuring from '../components/during/note_panel/NotePanelDuring'
import NotePanelAfter from '../components/after/NotePanelAfter'

import LessonPanelBefore from '../components/before/LessonPanelBefore'
import LessonPanelDuring from '../components/during/lesson_panel/LessonPanelDuring'
import LessonPanelAfter from '../components/after/LessonPanelAfter'
import Before from '../components/before/Before'
import During from '../components/during/During'
import After from '../components/after/After'

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
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden">
      <div className="flex border border-borderDebug">
        {lessonStatus === 'before' && <Before />}
        {lessonStatus === 'during' && <During />}
        {lessonStatus === 'after' && <After />}
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
