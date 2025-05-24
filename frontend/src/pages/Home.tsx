import { Link } from 'react-router-dom'
import { useLesson } from '../context/LessonContext'

import Before from '../components/before/Before'
import During from '../components/during/During'
import After from '../components/after/After'

function Home() {
  const { lessonStatus } = useLesson()

  return (
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden relative">
      <div className="flex">
        {lessonStatus === 'before' && <Before />}
        {lessonStatus === 'during' && <During />}
        {lessonStatus === 'after' && <After />}
      </div>

      {/* about / donate buttons */}
      {lessonStatus !== 'during' && 
      <div className="fixed bottom-2 font-mono text-fg text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl brightness-80 flex gap-1 items-center">
        <Link
          to="/help"
          className="hover:underline transition leading-tight"
          aria-label="about"
        >
          about
        </Link>
        <span>|</span>
        <a
          href="https://github.com/hentity/fretty"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition leading-tight"
          aria-label="github"
        >
          github
        </a>
        <span>|</span>
        <a
          href="https://buymeacoffee.com/hhame4g"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline transition leading-tight"
          aria-label="support"
        >
          support
        </a>
      </div>
      }
    </div>
  )
}

export default Home