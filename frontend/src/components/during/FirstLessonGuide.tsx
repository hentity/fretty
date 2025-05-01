import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../../components/TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';

export default function FirstLessonGuide() {
  const { currentSpot, tutorialStep } = useLesson();

  if (!currentSpot) return null;

  const { string, fret, note } = currentSpot;

  const tutorialMessages = [
    [
      {text: `Play the note indicated on the left - ${note} on string ${string + 1}.\nIt's position is highlighted in `, className: 'text-fg'},
      {text: `green`, className: 'text-good font-bold'},
      {text: ` on the fretboard`, className: 'text-fg'},
    ],
    [
      {text: `The position of a note will only be highlighted the first  \n`, className: 'text-fg'},
      {text: `time you practice it. Play the ${note} to continue.`, className: 'text-fg'},
    ],
    [
      {text: `You're getting the hang of it :) If later you forget a note, \n`, className: 'text-fg'},
      {text: `don't stress - it will be highlighted in `, className: 'text-fg'},
      {text: `red`, className: 'text-fail font-bold'},
      {text: ` to remind you.`, className: 'text-fg'},
    ],
    [
      {text: `Last one. After this, you'll be timed and can start\n`, className: 'text-fg'},
      {text: `progressing through the fretboard. Good luck!`, className: 'text-fg'},
    ],
  ];

  if (tutorialStep >= tutorialMessages.length) return null;

  const content = tutorialMessages[tutorialStep]

  return (
    <TextBox
      width={65}
      height={2}
      content={content}
      className={'bg-stone-800 outline-4 outline-stone-800'}
    />
  );
}
