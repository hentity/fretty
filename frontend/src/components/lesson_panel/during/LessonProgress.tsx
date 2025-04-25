import { useLesson } from '../../../context/LessonContext'

function LessonProgress() {
  const { completedSpots, lessonQueue } = useLesson()

  const totalSpots = completedSpots.length + lessonQueue.length + 1
  const reviewedCount = completedSpots.length

  return (
    <div className="w-full text-center py-2 border border-borderDebug text-textLight text-sm">
      {reviewedCount} / {totalSpots} spots reviewed
    </div>
  )
}

export default LessonProgress
