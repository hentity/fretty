import { useLesson } from '../context/LessonContext'

import Before from '../components/before/Before'
import During from '../components/during/During'
import After from '../components/after/After'

function Home() {
  const { lessonStatus } = useLesson()
  
  return (
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden">
      <div className="flex">
        {lessonStatus === 'before' && <Before />}
        {lessonStatus === 'during' && <During />}
        {lessonStatus === 'after' && <After />}
      </div>
    </div>
  )
}

export default Home