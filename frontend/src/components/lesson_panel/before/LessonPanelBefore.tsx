import { buildLesson } from '../../../logic/lessonUtils'
import { useAuth } from '../../../context/UserContext'
import useProgress from '../../../hooks/useProgress'

function LessonPanelBefore() {
  const { user } = useAuth()
  const { progress } = useProgress(user)

  if (!progress) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm border border-dashed border-borderDebug">
        Loading progress...
      </div>
    )
  }

  const lessonPreview = buildLesson(progress)

  if (lessonPreview.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm border border-dashed border-borderDebug">
        No spots to review today.
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start overflow-y-auto p-4 border border-dashed border-borderDebug text-textLight">
      <h2 className="text-lg font-bold mb-4">Lesson Preview</h2>
      <ul className="space-y-2 w-full max-w-md">
        {lessonPreview.map((spot, index) => (
          <li
            key={index}
            className="flex justify-between px-4 py-2 bg-primaryLight rounded shadow-sm"
          >
            <span>String: {spot.string}</span>
            <span>Note: {spot.note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default LessonPanelBefore
