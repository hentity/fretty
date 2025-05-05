import { useMemo } from 'react';
import { useLesson } from '../context/LessonContext';
import { TextBox } from '../components/TextBox';
import { interpolateColor, makeTextBlock } from '../styling/stylingUtils';
import { ColoredChunk } from '../types';

const MASTERED_THRESHOLD = 14;

const STATIC_MARKERS = [
  { fret: 3, string: 3 },
  { fret: 5, string: 3 },
  { fret: 7, string: 3 },
  { fret: 9, string: 3 },
  { fret: 12, string: 2 },
  { fret: 12, string: 4 },
] as const;

type SpotStatus = 'unpracticed' | 'practicing' | 'mastered';

type SpotKey = `${number}:${number}`;

export default function Profile() {
  const { progress } = useLesson();

  const spotMap = useMemo(() => {
    const map: Record<SpotKey, { status: SpotStatus; label: string }> = {};
    if (!progress) return map;

    for (const spot of progress.spots) {
      if (spot.status === 'unlearnable') continue;
      const key = `${spot.string + 1}:${spot.fret}` as SpotKey;
      const label = spot.note?.[0]?.toUpperCase() ?? ' ';
      let status: SpotStatus = 'unpracticed';
      if (spot.interval >= MASTERED_THRESHOLD) status = 'mastered';
      else if (spot.num_practices > 0) status = 'practicing';
      map[key] = { status, label };
    }
    return map;
  }, [progress]);

  const tuning = useMemo(
    () => (progress?.tuning ?? ['E', 'B', 'G', 'D', 'A', 'E']).map(s => s[0].toUpperCase()),
    [progress]
  );

  const rowChunks = (label: string, stringNo: number): ColoredChunk[] => {
    const chunks: ColoredChunk[] = [
      { text: ` ${label} `, className: 'text-fg' },
      { text: `║`, className: 'text-fg' },
    ];

    for (let fret = 1; fret <= 12; fret++) {
      const key = `${stringNo}:${fret}` as SpotKey;
      const entry = spotMap[key];

      const isMark = STATIC_MARKERS.some(m => m.string === stringNo && m.fret === fret);
      const char = entry ? entry.label.padEnd(2, ' ') : (isMark ? '● ' : '  ');
      let className = 'text-fg';

      if (entry?.status === 'practicing') className = `bg-practiced text-bg`;
      if (entry?.status === 'mastered') className = 'bg-mastered text-bg';
      if (entry?.status === 'unpracticed') className = 'bg-stone-500 text-bg brightness-80';

      chunks.push({ text: ` ${char}`, className });
      chunks.push({ text: '|', className: 'text-fg' });
    }

    chunks.push({ text: '\n' });
    return chunks;
  };

  const legendContent: ColoredChunk[] = makeTextBlock([
    { text: '     ', className: 'text-fg' },
    { text: '   ', className: 'bg-practiced text-bg' },
    { text: ' learning   ', className: 'text-fg' },
    { text: '   ', className: 'bg-mastered text-bg' },
    { text: ' mastered   ', className: 'text-fg' },
    { text: '   ', className: 'bg-stone-500 text-bg brightness-80' },
    { text: ' unpracticed', className: 'text-fg' },
  ]);

  const fretboardContent = useMemo(() => {
    const rows: ColoredChunk[] = [];
    for (let i = 5; i >= 0; i--) {
      rows.push(...rowChunks(tuning[i] ?? 'E', i + 1));
    }
    return makeTextBlock(rows);
  }, [spotMap, tuning]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 gap-4">
      <TextBox width={52} height={1} content={legendContent} />
      <TextBox width={52} height={6} content={fretboardContent} />
    </div>
  );
}
