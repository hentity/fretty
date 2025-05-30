import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../../components/TextBox';

export default function FirstLessonGuide() {
  const { currentSpot, tutorialStep } = useLesson();

  if (!currentSpot) return null;

  const { string, note } = currentSpot;

  const tutorialMessages = [
    [
      {text: `Play the note indicated on the left - ${note} on string ${string + 1}.\nIt's position is highlighted in `, className: 'text-fg'},
      {text: `green`, className: 'text-good font-bold'},
      {text: ` on the fretboard`, className: 'text-fg'},
    ],
    [
      {text: `The position of a note will only be highlighted the first  \n`, className: 'text-fg'},
      {text: `time you practice it. Play the ${note} on string ${string+1} to continue.`, className: 'text-fg'},
    ],
    [
      {text: `You're getting the hang of it :) If you forget a note, \n`, className: 'text-fg'},
      {text: `don't stress - it will be highlighted in `, className: 'text-fg'},
      {text: `red`, className: 'text-fail font-bold'},
      {text: ` to remind you.`, className: 'text-fg'},
    ],
    [
      {text: `The learning algorithm will guide you through the\n`, className: 'text-fg'},
      {text: `fretboard at your own pace wth short daily lessons.`, className: 'text-fg'},
    ],
    [
      {text: `This works best if you come back every day.\n`, className: 'text-fg'},
      {text: `(but if you miss some days, the algorithm will adapt)`, className: 'text-fg'},
    ],
    [
      {text: `Last note. After this, you'll start progressing through\n`, className: 'text-fg'},
      {text: `the fretboard, starting with the first string. Good luck!`, className: 'text-fg'},
    ],
  ];

  if (tutorialStep >= tutorialMessages.length) return null;

  const content = tutorialMessages[tutorialStep]

  return (
    <TextBox
      width={65}
      height={2}
      content={content}
      className={'bg-stone-700 outline-4 outline-stone-700'}
    />
  );
}
