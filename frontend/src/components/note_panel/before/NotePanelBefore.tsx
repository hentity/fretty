import { useLesson } from '../../../context/LessonContext'

function NotePanelBefore() {
  const { startLesson } = useLesson()

  return (
    <div className="w-full h-full border border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-600 text-sm">
      <p className="mb-4">NotePanelBefore</p>
      <button
        onClick={startLesson}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        Start Lesson
      </button>
    </div>
  )
}

export default NotePanelBefore
