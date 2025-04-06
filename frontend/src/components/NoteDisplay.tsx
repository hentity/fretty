import { PlayIcon } from '@heroicons/react/24/solid'

function NoteDisplay({ lessonStatus, currentNote, noteStatus }) {
  let content = null

  switch (lessonStatus) {
    case 'before':
      content = (
        <button
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
