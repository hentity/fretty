import { useLesson } from '../../../context/LessonContext'

function LessonPanelAfter() {
  const { completedSpots } = useLesson()

  if (completedSpots.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm border border-dashed border-borderDebug">
        No spots reviewed today.
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-start overflow-y-auto p-4 border border-dashed border-borderDebug text-textLight">
      <h2 className="text-lg font-bold mb-4">Lesson Review</h2>
      <ul className="space-y-2 w-full max-w-md">
        {completedSpots.map((spot, index) => (
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

export default LessonPanelAfter
