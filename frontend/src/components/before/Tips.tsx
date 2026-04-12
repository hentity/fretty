import { useEffect, useState } from 'react';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';

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

const TYPING_SPEED = 6; // ms per character
const ROTATE_INTERVAL = 20000; // ms between tip rotations
const WIDTH = 60;

function wordWrap(text: string): string {
  const words = text.split(' ');
  let line1 = '';
  let overflow = false;
  let line2Words: string[] = [];
  for (const word of words) {
    if (!overflow) {
      const candidate = line1 ? `${line1} ${word}` : word;
      if (candidate.length <= WIDTH) {
        line1 = candidate;
      } else {
        overflow = true;
        line2Words.push(word);
      }
    } else {
      line2Words.push(word);
    }
  }
  const line2 = line2Words.join(' ');
  return line2 ? `${line1}\n${line2}` : line1;
}

export default function Tips() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [charCount, setCharCount] = useState(0);

  // Reset typing when tip changes
  useEffect(() => {
    setCharCount(0);
  }, [tipIndex]);

  // Rotate tip every ROTATE_INTERVAL ms
  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const fullText = wordWrap(`tip: ${TIPS[tipIndex]}`);

  // Typing effect
  useEffect(() => {
    if (charCount >= fullText.length) return;
    const id = setInterval(() => {
      setCharCount(c => c + 1);
    }, TYPING_SPEED);
    return () => clearInterval(id);
  }, [charCount, fullText.length]);

  const visible = fullText.slice(0, charCount);

  const content = makeTextBlock([
    { text: visible, className: 'text-fg brightness-50' },
  ]);

  return (
    <TextBox width={60} height={2} content={content} />
  );
}
