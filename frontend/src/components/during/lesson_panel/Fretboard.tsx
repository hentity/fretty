import { useMemo } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import { ColoredChunk } from '../../../types';

const STATIC_MARKERS = [
  { fret: 3, string: 3 },
  { fret: 5, string: 3 },
  { fret: 7, string: 3 },
  { fret: 9, string: 3 },
  { fret:12, string: 2 },
  { fret:12, string: 4 },
] as const;

function rowChunks(
  label: string,
  stringNo: number,
  hi: { string: number; fret: number; className: string } | null,
  currentSpotString: number | null
): ColoredChunk[] {
  const isCurrentString = stringNo === currentSpotString;
  const rowClass = isCurrentString ? 'bg-fg text-bg' : 'text-fg';

  const chunks: ColoredChunk[] = [
    { text: ` ${label} `, className: rowClass }, 
    { text: `║`, className: 'text-fg' }
  ];

  for (let f = 1; f <= 12; f++) {
    const isHi   = hi && hi.string === stringNo && hi.fret === f;
    const isMark = STATIC_MARKERS.some(m => m.string === stringNo && m.fret === f);
    const char   = isMark ? '●' : ' ';
    const cell   = ` ${char} `;
    chunks.push({
      text: cell,
      className: isHi ? hi.className : 'text-fg',
    });
    chunks.push({ text: '|', className: 'text-fg' });
  }
  chunks.push({ text: '\n' });

  return chunks;
}

export default function Fretboard() {
  const { progress, highlight, currentSpot } = useLesson();

  const tuning = useMemo(
    () => (progress?.tuning ?? ['E','B','G','D','A','E']).map(s => s[0].toUpperCase()),
    [progress]
  );

  const currentString = currentSpot ? currentSpot.string + 1 : null;

  // if the current spot is new, show its position as persistent highlight
  const persistentHighlight = useMemo(() => {
    if (currentSpot?.is_new) {
      return {
        string: currentSpot.string + 1, // your fretboard is 1-indexed
        fret: currentSpot.fret,
        className: 'bg-good',
      };
    }
    return highlight;
  }, [currentSpot, highlight]);

  const content = useMemo(() => {
    const rows: ColoredChunk[] = [];
    for (let i = 0; i < 6; i++) {
      rows.push(...rowChunks(tuning[i] ?? 'E', i + 1, persistentHighlight, currentString));
    }
    return makeTextBlock(rows);
  }, [tuning, persistentHighlight, currentString]);

  return (
    <div className="flex flex-col items-center">
      <TextBox
        width={52}
        height={6}
        content={content}
      />
    </div>
  );
}
