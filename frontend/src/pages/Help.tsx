import { TextBox } from "../components/TextBox";

export default function Help() {

  const content = [
    {text: 'Memorising the guitar fretboard makes it faster to find notes, build chords,  \n', className: 'text-fg'}, 
    {text: 'play scales, and improvise across the neck without relying on patterns.       \n\n', className: 'text-fg'}, 
    {text: 'This site is designed to teach the notes of the fretboard in less than five   \n', className: 'text-fg'},
    {text: 'minutes per day. It uses a ', className: 'text-fg'},
    {
      text: 'spaced repetition', 
      className: 'text-easy underline hover:brightness-80 hover:cursor-pointer', 
      onClick: () => window.open('https://en.wikipedia.org/wiki/Spaced_repetition', '_blank')
    },
    {text: ' learning algorithm to guide you \n', className: 'text-fg'},
    {text: 'through the fretboard at your own pace, only introducing new notes when you  \n', className: 'text-fg'},
    {text: 'are ready.                                                                   \n', className: 'text-fg'},
    {
      text: '\n[ github ]',
      className: 'text-fg hover:bg-fg hover:text-bg active:bg-fg active:text-bg transition font-bold',
      onClick: () => window.open('https://github.com/hentity/fretty', '_blank')
    },
  ]

  return (
    <div className="flex flex-col flex-grow items-center justify-center overflow-hidden">
    <TextBox
      width={80}
      height={10}
      content={content}
    />
    </div>
  );
}
