import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../../components/TextBox';

export default function FirstLessonGuide() {
  const { currentSpot, tutorialStep, tutorialAllowNext, advance } = useLesson();

  if (!currentSpot) return null;

  const { string, note } = currentSpot;
  console.log(string)

  function handleNext() {
    return
  }

  const tutorialMessages = [
    [
      {text: `Play the note shown on the left (${note})\nIt's position is shown in `, className: 'text-fg'},
      {text: `green`, className: 'text-good font-bold'},
      {text: ` on the fretboard.`, className: 'text-fg'},
    ],
    [
      {text: `The position of a note will be shown `, className: 'text-fg'},
      {text: `the first  \n`, className: 'text-fg'},
      {text: `time you practice it. Play the ${note} to continue.`, className: 'text-fg'},
    ],
    [
      {text: `You're getting the hang of it :) \n`, className: 'text-fg'},
      {text: `Try a few more.`, className: 'text-fg'},
    ],
    [
      {text: `Short lessons will guide you through\n`, className: 'text-fg'},
      {text: `the fretboard at your own pace.`, className: 'text-fg'},
    ],
    [
      {text: `This works best if you practice daily.\n`, className: 'text-fg'},
      {text: `Each lesson should take 5 minutes or less.`, className: 'text-fg'},
    ],
    [
      {text: `Last one. Your first lesson will begin now,\n`, className: 'text-fg'},
      {text: `starting with the first string. Good luck!`, className: 'text-fg'},
    ],
  ];

  const nextButton = [
    { text: '    next    ', onClick: handleNext , className: 'text-bg bg-good font-bold' + (!tutorialAllowNext ? 'brightness-50' : '')},
  ]

  if (tutorialStep >= tutorialMessages.length) return null;

  const content = tutorialMessages[tutorialStep]

  // parent wrapper controls brightness
  const wrapperClass =
    `h-full flex items-center justify-center bg-good ${tutorialAllowNext ? 'brightness-130' : 'brightness-30'}`

  function tutorialAdvance() {
    advance(null);
  }


return (
  <div className="flex items-stretch justify-center p-1 bg-stone-700">
    <TextBox
      width={50}
      height={2}
      content={content}
      className="bg-stone-700"
    />

    {/* wrapper owns the tall background; child stays its natural height and is centered */}
    <div className={`${wrapperClass}`} aria-disabled={!tutorialAllowNext} onClick={tutorialAdvance}>
      <TextBox
        width={12}
        height={1}
        content={nextButton}
        className="bg-transparent outline-0"
      />
    </div>
  </div>
);

}
