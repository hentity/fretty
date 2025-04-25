import { useLesson } from '../../../context/LessonContext'
import { LEARNING_GOOD_ATTEMPTS } from '../../../logic/lessonUtils'

function NotePanelDuring() {
  const { currentSpot } = useLesson()

  if (!currentSpot) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        No spot selected.
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center">
      <div className="text-xl font-bold mb-2">Note: {currentSpot.note}</div>
      <div className="text-lg">String: {currentSpot.string}</div>
      <div className="text-lg">Note progress: {currentSpot.good_attempts} / {LEARNING_GOOD_ATTEMPTS} </div>
    </div>
  )
}

export default NotePanelDuring 