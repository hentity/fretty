import { useIntroTour } from '../../context/IntroTourContext';
import { TextBox } from '../TextBox';

// All messages fit within height=2 at width=50 (50 chars per line).
// Use \n to force a line break where needed.
const INTRO_MESSAGES: Array<Array<{ text: string; className: string }>> = [
  // 0 — note panel
  [{ text: 'Welcome to fretty!\nThe note panel shows which note to play.', className: 'text-fg' }],
  // 1 — fretboard: string layout
  [{ text: 'A string will be highlighted on the fretboard.\nYou should play the note on this string.', className: 'text-fg' }],
  // 2 — fretboard: position hint (note highlight shown here)
  [{ text: "When you first learn a note, it will be shown in\ngreen like so.", className: 'text-fg' }],
  // 3 — timer intro
  [{ text: 'This is the timer. You will have 5 seconds\nto play each note.', className: 'text-fg' }],
  // 4 — easy
  [
    { text: "'Easy'", className: 'text-easy font-bold' },
    { text: ' (blue zone) fills 2 pips!\n', className: 'text-fg' },
    { text: 'You need 3 pips to complete a note.', className: 'text-fg' },
  ],
  // 5 — good
  [
    { text: "'Good'", className: 'text-good font-bold' },
    { text: ' (green zone) fills 1 pip.\n', className: 'text-fg' },
    { text: '3 pips — this note is complete for today!', className: 'text-fg' },
  ],
  // 6 — hard
  [
    { text: "'Hard'", className: 'text-hard font-bold' },
    { text: ' (yellow zone) fills no pips.\n', className: 'text-fg' },
    { text: "", className: 'text-fg' },
  ],
  // 7 — fail
  [
    { text: 'Running out of time is a ', className: 'text-fg' },
    { text: "'fail'", className: 'text-fail font-bold' },
    { text: ' — pips are reset.\n', className: 'text-fg' },
    { text: "This is normal, you can always try again :)", className: 'text-fg' },
  ],
  // 9 — transition to tutorial
  [{ text: "Ok, get your guitar ready.\nLet's practice a few notes without the timer...", className: 'text-fg' }],
];

const DEMO_STEPS = new Set([4, 5, 6, 7]);

export default function IntroTour() {
  const { introStep, introDemoComplete, advanceIntro } = useIntroTour();

  if (introStep < 0 || introStep >= INTRO_MESSAGES.length) return null;

  const isLastStep = introStep === INTRO_MESSAGES.length - 1;
  const isDemoStep = DEMO_STEPS.has(introStep);
  const canAdvance = !isDemoStep || introDemoComplete;

  function handleNext() {
    if (!canAdvance) return;
    advanceIntro();
  }

  const nextButton = [
    {
      text: isLastStep ? '   start!   ' : '    next    ',
      className: 'text-bg bg-good font-bold',
    },
  ];

  const wrapperClass =
    `h-full flex items-center justify-center bg-good ${canAdvance ? 'brightness-130' : 'brightness-30'}`;

  return (
    <div className="flex items-stretch justify-center p-1 bg-stone-700">
      <TextBox
        width={50}
        height={2}
        content={INTRO_MESSAGES[introStep]}
        className="bg-stone-700"
      />
      <div className={wrapperClass} aria-disabled={!canAdvance} onClick={handleNext}>
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
