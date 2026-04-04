import { playEasy, playGood, playHard, playFail, playNoteComplete, playLessonComplete } from '../logic/sounds';

const SOUNDS = [
  { label: 'easy',           fn: () => playEasy('E', 4) },
  { label: 'good',           fn: () => playGood('E', 4) },
  { label: 'hard',           fn: () => playHard('E', 4) },
  { label: 'fail',           fn: playFail },
  { label: 'note complete',  fn: () => playNoteComplete('E', 4) },
  { label: 'lesson complete',fn: playLessonComplete },
];

export default function SoundTest() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full font-mono text-fg">
      <p className="text-fg brightness-60 text-sm">sound test — click to play</p>
      {SOUNDS.map(({ label, fn }) => (
        <button
          key={label}
          onClick={fn}
          className="px-6 py-2 border border-fg hover:bg-fg hover:text-bg transition cursor-pointer"
        >
          [ {label} ]
        </button>
      ))}
    </div>
  );
}
