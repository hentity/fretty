import { useEffect, useState } from 'react';

const TIPS = [
  'practicing for just a few minutes a day is fine — consistency beats long sessions',
  'fretty times your responses to determine how comfortable you are with a note',
  'the dots on the fretboard mark frets 3, 5, 7, 9 and 12',
  'check the progress page to see which notes you\'ve mastered',
  'make sure your guitar is tuned and in range of your microphone',
  'fretty uses spaced repetition — notes you nail need less review, tricky ones more',
  'want to learn the notes in another tuning? set a custom tuning in settings',
  'fretty is designed to be used every day',
  'once you\'ve learned the low E string, you also know the high E string!',
  'above the 12th fret, the notes repeat up the octave',
  'once you know all the notes, you have also learned a complete C major scale!',
  'play sharps or flats by moving one fret up or down from a natural note'
];

const TYPING_SPEED = 6;
const ROTATE_INTERVAL = 20000;

export default function Tips() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(0);
  }, [tipIndex]);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const fullText = `tip: ${TIPS[tipIndex]}`;

  useEffect(() => {
    if (charCount >= fullText.length) return;
    const id = setInterval(() => setCharCount(c => c + 1), TYPING_SPEED);
    return () => clearInterval(id);
  }, [charCount, fullText.length]);

  return (
    <div className="w-full text-center font-mono text-xs sm:text-sm md:text-base text-fg/40 px-6 py-2">
      {fullText.slice(0, charCount)}
    </div>
  );
}
