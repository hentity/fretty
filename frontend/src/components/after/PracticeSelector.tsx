import React, { useMemo, useState } from 'react';
import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';
import { ColoredChunk, Spot } from '../../types';

const ABSOLUTE_MAX = 10;

const STATIC_MARKERS = [
  { fret: 3,  string: 3 },
  { fret: 5,  string: 3 },
  { fret: 7,  string: 3 },
  { fret: 9,  string: 3 },
  { fret: 12, string: 2 },
  { fret: 12, string: 4 },
] as const;

type Props = { onStart: (spots: Spot[]) => void };

export default function PracticeSelector({ onStart }: Props) {
  const { progress } = useLesson();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tuning = useMemo(
    () => (progress?.tuning ?? ['E', 'B', 'G', 'D', 'A', 'E']).map(s => s.slice(0, -1).toUpperCase()),
    [progress],
  );

  const maxPicks = useMemo(() => {
    const knownCount = progress?.spots.filter(s => s.status === 'review').length ?? 0;
    return Math.min(knownCount, ABSOLUTE_MAX);
  }, [progress]);

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else if (next.size < maxPicks) {
        next.add(key);
      }
      return next;
    });
  };

  const fretboardContent = useMemo(() => {
    if (!progress) return [];

    const rows: ColoredChunk[] = [];

    for (let i = 5; i >= 0; i--) {
      const label     = tuning[i] ?? 'E';
      const stringIdx = i;

      const chunks: ColoredChunk[] = [
        { text: label, className: 'text-fg', manualWidth: 3 },
        { text: '║', className: 'text-fg' },
      ];

      for (let fret = 1; fret <= 12; fret++) {
        const key    = `${stringIdx}-${fret}`;
        const spot   = progress.spots.find(s => s.string === stringIdx && s.fret === fret);
        const isMark = STATIC_MARKERS.some(m => m.string === stringIdx + 1 && m.fret === fret);

        if (!spot || spot.status !== 'review') {
          const char = (!spot || spot.status === 'unlearnable')
            ? (isMark ? '● ' : '  ')
            : spot.note[0].toUpperCase().padEnd(2, ' ');
          chunks.push({ text: ` ${char}`, className: 'text-fg brightness-30' });
        } else {
          const noteLabel  = spot.note[0].toUpperCase().padEnd(2, ' ');
          const isSelected = selected.has(key);
          const atMax = selected.size >= maxPicks;

          let className: string;
          let style: React.CSSProperties = {};

          if (isSelected) {
            className = 'bg-mastered text-bg brightness-140 cursor-pointer';
          } else if (atMax) {
            className = 'bg-mastered text-bg brightness-70 cursor-default';
          } else {
            className = 'bg-mastered text-bg brightness-70 hover:brightness-80 cursor-pointer';
          }

          chunks.push({
            text: ` ${noteLabel}`,
            className,
            style,
            onClick: () => toggle(key),
          });
        }

        chunks.push({ text: '|', className: 'text-fg brightness-50' });
      }

      chunks.push({ text: '\n' });
      rows.push(...chunks);
    }

    return makeTextBlock(rows);
  }, [progress, tuning, selected]);

  const count = selected.size;

  const handleStart = () => {
    if (!progress || count === 0) return;
    const spots = progress.spots.filter(
      s => selected.has(`${s.string}-${s.fret}`)
    );
    onStart(spots);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <TextBox width={52} height={1} content={[{ text: `select notes to practice (up to ${maxPicks})`, className: 'text-fg brightness-90' }]} />
      <TextBox width={52} height={6} content={fretboardContent} className="py-2"/>
      {count > 0 ? (
        <button
          onClick={handleStart}
          className="font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl text-fg outline outline-2 outline-fg rounded px-8 py-0.5 bg-easy/10 hover:bg-easy/20 active:brightness-75 transition cursor-pointer"
        >
          practice {count} {count === 1 ? 'note' : 'notes'}
        </button>
      ) : (
        <span className="font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl text-hard brightness-60 outline outline-2 outline-transparent rounded px-8 py-0.5">
          (won't count towards your progress)
        </span>
      )}
    </div>
  );
}
