import { useEffect, useState } from 'react';
import { TextBox } from '../../components/TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';

const LINES = [
  'You’ve completed your lesson for today - see you tomorrow :)',
];
const LINE_WIDTH = 80;
const TYPING_SPEED = 5; // ms per character

export default function LessonCompleteText() {
  const [charCount, setCharCount] = useState(0);
  const totalChars = LINES.reduce((sum, line) => sum + line.length, 0);

  useEffect(() => {
    if (charCount >= totalChars) return;
    const interval = setInterval(() => {
      setCharCount((prev) => prev + 1);
    }, TYPING_SPEED);
    return () => clearInterval(interval);
  }, [charCount, totalChars]);

  const chunks = [];
  let charsLeft = charCount;

  for (const line of LINES) {
    const visiblePart = line.slice(0, charsLeft);
    const leftPad = Math.floor((LINE_WIDTH - line.length) / 2);
    const padded =
      ' '.repeat(leftPad) +
      visiblePart +
      ' '.repeat(LINE_WIDTH - leftPad - visiblePart.length);
    chunks.push({ text: padded + '\n', className: 'text-fg' });

    charsLeft -= visiblePart.length;
    if (charsLeft <= 0) break;
  }

  const content = makeTextBlock(chunks);

  return (
    <TextBox
      width={LINE_WIDTH}
      height={LINES.length}
      content={content}
    />
  );
}
