import React, { useMemo } from 'react';
import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { makeTextBlock } from '../../styling/stylingUtils';
import { ColoredChunk } from '../../types';

const STATIC_MARKERS = [
  { fret: 3,  string: 3 },
  { fret: 5,  string: 3 },
  { fret: 7,  string: 3 },
  { fret: 9,  string: 3 },
  { fret: 12, string: 2 },
  { fret: 12, string: 4 },
] as const;

type Props = { onContinue: () => void };

export default function LessonPreviewFretboard({ onContinue }: Props) {
  const { progress, pendingLesson, pendingReviewKeys } = useLesson();

  const { reviewKeys, newKeys } = useMemo(() => {
    const newKeys = new Set<string>();
    for (const spot of pendingLesson) {
      const key = `${spot.string}-${spot.fret}`;
      if (!pendingReviewKeys.has(key)) newKeys.add(key);
    }
    return { reviewKeys: pendingReviewKeys, newKeys };
  }, [pendingLesson, pendingReviewKeys]);

  const tuning = useMemo(
    () => (progress?.tuning ?? ['E', 'B', 'G', 'D', 'A', 'E']).map(s => s.slice(0, -1).toUpperCase()),
    [progress],
  );

  const fretboardContent = useMemo(() => {
    if (!progress) return [];

    const rows: ColoredChunk[] = [];

    for (let i = 5; i >= 0; i--) {
      const label     = tuning[i] ?? 'E';
      const stringIdx = i; // 0-indexed

      const chunks: ColoredChunk[] = [
        { text: label, className: 'text-fg', manualWidth: 3 },
        { text: '║', className: 'text-fg' },
      ];

      for (let fret = 1; fret <= 12; fret++) {
        const key   = `${stringIdx}-${fret}`;
        const spot  = progress.spots.find(s => s.string === stringIdx && s.fret === fret);
        const isMark = STATIC_MARKERS.some(m => m.string === stringIdx + 1 && m.fret === fret);

        if (!spot || spot.status === 'unlearnable') {
          const char = isMark ? '● ' : '  ';
          chunks.push({ text: ` ${char}`, className: 'text-fg brightness-20' });
        } else {
          const noteLabel  = spot.note[0].toUpperCase().padEnd(2, ' ');
          const isNew      = newKeys.has(key);
          const isReview   = reviewKeys.has(key);
          // stagger pulse so notes don't all blink in unison
          const delay = ((stringIdx * 7 + fret * 3) * 137) % 1500;

          let className: string;
          let style: React.CSSProperties = {};

          if (isNew) {
            className = 'bg-good text-bg';
            style = { animationDelay: `${delay}ms` };
          } else if (isReview) {
            className = 'bg-mastered text-bg';
            style = { animationDelay: `${delay}ms` };
          } else {
            className = 'bg-unpracticed text-bg brightness-50';
          }

          chunks.push({ text: ` ${noteLabel}`, className, style });
        }

        chunks.push({ text: '|', className: 'text-fg brightness-50' });
      }

      chunks.push({ text: '\n' });
      rows.push(...chunks);
    }

    return makeTextBlock(rows);
  }, [progress, tuning, reviewKeys, newKeys]);

  const newCount    = newKeys.size;
  const reviewCount = reviewKeys.size;

  const summaryChunks: ColoredChunk[] = [{ text: 'in this lesson: ', className: 'text-fg' }];
  if (newCount > 0) {
    summaryChunks.push({
      text: `${newCount} new ${newCount === 1 ? 'note' : 'notes'}`,
      className: 'text-good',
    });
    if (reviewCount > 0) summaryChunks.push({ text: ', ', className: 'text-fg' });
  }
  if (reviewCount > 0) {
    summaryChunks.push({
      text: `${reviewCount} ${reviewCount === 1 ? 'note' : 'notes'} to review`,
      className: 'text-mastered',
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <TextBox width={52} height={1} content={makeTextBlock(summaryChunks)} />
      <TextBox width={52} height={6} content={fretboardContent} />
      <button
        onClick={onContinue}
        className="font-mono text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl text-fg border-2 border-fg rounded-md px-8 py-0.5 hover:bg-fg hover:text-bg active:brightness-75 transition cursor-pointer"
      >
        continue
      </button>
    </div>
  );
}
