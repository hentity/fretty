import { useRef } from 'react'
import { useLesson } from '../../../context/LessonContext'
import Timer, { TimerHandle } from './Timer'
import LessonProgress from './LessonProgress'
import Fretboard from './Fretboard'

function LessonPanelDuring() {
  const { advance } = useLesson()
  const timerRef = useRef<TimerHandle | null>(null)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-none">
        <LessonProgress />
      </div>

      <div className="flex-1 overflow-hidden">
        <Fretboard />
      </div>

      <div className="flex-none">
        <Timer
          ref={timerRef}
          totalTime={5000}
          easyTime={1700}
          goodTime={3000}
          onComplete={advance}
        />
      </div>
    </div>
  )
}

export default LessonPanelDuring
