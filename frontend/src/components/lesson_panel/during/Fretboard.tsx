import { useMemo } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../../components/TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import { ColoredChunk } from '../../../types';

/* (fret,string) pairs with permanent inlays */
const STATIC_MARKERS = [
  { fret: 3, string: 3 },
  { fret: 5, string: 3 },
  { fret: 7, string: 3 },
  { fret: 9, string: 3 },
  { fret:12, string: 2 },
  { fret:12, string: 4 },
] as const;

/* build a single row */
function rowChunks(
  label: string,
  stringNo: number,
  hi: { string: number; fret: number; className: string } | null
): ColoredChunk[] {
  const chunks: ColoredChunk[] = [{ text: ` ${label} ║`, className: 'text-fg' }];

  for (let f = 1; f <= 12; f++) {
    const isHi   = hi && hi.string === stringNo && hi.fret === f;
    const isMark = STATIC_MARKERS.some(m => m.string === stringNo && m.fret === f);
    const char   = (isMark) ? '●' : ' ';
    const cell   = ` ${char} `;
    chunks.push({ text: cell, className: isHi ? hi.className : 'text-fg' });
    chunks.push({text: '|', className: 'text-fg'})
  }
  chunks.push({ text: '\n' });

  return chunks;
}

export default function Fretboard() {
  const { progress, highlight, highlightSpot } = useLesson(); // 🔥 grab highlightSpot too

  /* memo-safe tuning default */
  const tuning = useMemo(
    () => (progress?.tuning ?? ['E','B','G','D','A','E']).map(s => s[0].toUpperCase()),
    [progress]
  );

  /* build board once per highlight/tuning change */
  const content = useMemo(() => {
    const rows: ColoredChunk[] = [];
    for (let i = 0; i < 6; i++) {
      rows.push(...rowChunks(tuning[i] ?? 'E', i + 1, highlight));
    }
    return makeTextBlock(rows);
  }, [tuning, highlight]);

  return (
    <div className="flex flex-col items-center">
      <TextBox
        width={60}
        height={6}
        content={content}
      />
    </div>
  );
}
