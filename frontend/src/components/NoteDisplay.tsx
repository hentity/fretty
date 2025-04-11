import { PlayIcon } from '@heroicons/react/24/solid'
import { Spot } from '../types'

type NoteDisplayProps = {
  lessonStatus: string
  currentSpot: Spot | null
  timerResult: string
  onStart: () => void
}

function NoteDisplay({ lessonStatus, currentSpot, timerResult, onStart }: NoteDisplayProps) {
  let content = null

  switch (lessonStatus) {
    case 'first':
    case 'before':
      content = (
        <button
          onClick={onStart}
          className="
            flex flex-col items-center justify-center w-full h-full
            text-textLight dark:text-textDark
          "
        >
          <PlayIcon className="w-3/4 h-auto max-h-[40%]" />
          <span className="mt-4 text-4xl font-bold">Start</span>
        </button>
      )
      break

    case 'after':
      content = (
        <p className="text-xl font-bold">See you tomorrow</p>
      )
      break
    
    case 'paused':
    case 'during':
        content = (
          <div className="flex flex-col items-center">
            <div className="text-xl font-bold">String {currentSpot.string}</div>
            <div className="text-xl font-bold">{currentSpot.note}</div>
          </div>
        )
        break
    
    default:
      content = null
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      {content}
    </div>
  )
}

export default NoteDisplay
