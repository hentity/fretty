import { useState } from 'react'
import { UserContext } from '../context/UserContext'
import { useContext } from 'react'
import NoteDisplay from '../components/NoteDisplay'

function Home() {
  const { user, loading } = useContext(UserContext)

  const lessonStates = ['first', 'before', 'during', 'after', 'paused']
  const [lessonStatus, setLessonStatus] = useState('before')
  const [currentNote, setCurrentNote] = useState({ name: 'C', octave: 4 })
  const [timerResult, setTimerResult] = useState('idle')

  const cycleLessonStatus = () => {
    const currentIndex = lessonStates.indexOf(lessonStatus)
    const nextIndex = (currentIndex + 1) % lessonStates.length
    setLessonStatus(lessonStates[nextIndex])
  }

  if (loading) return <p>Loading user...</p>

  return (
    <div className="flex flex-col min-h-screen items-center justify-center overflow-hidden">
      <div
        className="aspect-[21/9] w-[100vw] h-auto max-w-[1024px] max-h-[calc(1024px*(9/21))]"
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
                currentNote={currentNote}
                timerResult={timerResult}
              />
            </div>
          </div>

          {/* Lesson Panel */}
          <div className="w-3/4 h-full flex flex-col justify-center m-1">
            <div className="flex-1 flex items-center justify-center m-1 border border-borderDebug">
              Lesson preview / Lesson+Fretboard / Lesson review
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
