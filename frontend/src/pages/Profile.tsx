import { useMemo, useState, useEffect } from 'react';
import { useLesson } from '../context/LessonContext';
import { TextBox } from '../components/TextBox';
import { getCssVarRgb, makeTextBlock } from '../styling/stylingUtils';
import { ColoredChunk } from '../types';
import { getMasteryPct, MASTERED_THRESHOLD } from '../logic/lessonUtils';

const STATIC_MARKERS = [
  { fret: 3, string: 3 },
  { fret: 5, string: 3 },
  { fret: 7, string: 3 },
  { fret: 9, string: 3 },
  { fret: 12, string: 2 },
  { fret: 12, string: 4 },
] as const;

type SpotStatus = 'unpracticed' | 'practicing' | 'mastered';
type SpotKey = `${number}-${number}`;

type SpotInfo = {
  masteryPct: number;
  numPractices: number;
  nextReview: string;
};

function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);

    const listener = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);

  return isTouch;
}

function interpolateCssVars(var1: string, var2: string, t: number): string {
  const rgb1 = getCssVarRgb(var1);
  const rgb2 = getCssVarRgb(var2);
  const result = rgb1.map((c1, i) => Math.round(c1 + t * (rgb2[i] - c1)));
  return `rgb(${result.join(',')})`;
}

export default function Profile() {
  const { progress } = useLesson();
  const [hoveredInfo, setHoveredInfo] = useState<SpotInfo | null>(null);
  const [toggledKey, setToggledKey] = useState<SpotKey | null>(null);
  const isTouch = useIsTouchDevice();

  const spotMap = useMemo(() => {
    const map: Record<SpotKey, { status: SpotStatus; label: string; info: SpotInfo }> = {};
    if (!progress) return map;

    for (const spot of progress.spots) {
      if (spot.status === 'unlearnable') continue;
      const key = `${spot.string + 1}-${spot.fret}` as SpotKey;
      const label = spot.note?.[0]?.toUpperCase() ?? ' ';
      let status: SpotStatus = 'unpracticed';
      if (spot.interval >= MASTERED_THRESHOLD) status = 'mastered';
      else if (spot.num_practices > 0) status = 'practicing';

      let masteryPct = getMasteryPct(spot);
      if (spot.status === 'unseen') masteryPct = 0;

      const numPractices = spot.num_practices;
      const nextReview = progress.spot_to_review_date[`${spot.string}-${spot.fret}`];

      const info: SpotInfo = { masteryPct, numPractices, nextReview };

      map[key] = { status, label, info };
    }

    return map;
  }, [progress]);

  const tuning = useMemo(
    () => (progress?.tuning ?? ['E', 'B', 'G', 'D', 'A', 'E']).map(s => s[0].toUpperCase()),
    [progress]
  );

  useEffect(() => {
    if (hoveredInfo === null) {
      setToggledKey(null);
    }
  }, [hoveredInfo]);

  const rowChunks = (label: string, stringNo: number): ColoredChunk[] => {
    if (!progress) return [];

    const chunks: ColoredChunk[] = [
      { text: ` ${label} `, className: 'text-fg' },
      { text: `║`, className: 'text-fg' },
    ];

    for (let fret = 1; fret <= 12; fret++) {
      const key = `${stringNo}-${fret}` as SpotKey;
      const entry = spotMap[key];

      const isMark = STATIC_MARKERS.some(m => m.string === stringNo && m.fret === fret);
      const char = entry ? entry.label.padEnd(2, ' ') : isMark ? '● ' : '  ';
      let className = 'text-fg';
      let style: React.CSSProperties = {};

      if (entry?.status === 'practicing') {
        const bright = key === toggledKey;
        className = `text-black hover:brightness-150 ${bright ? 'brightness-150' : ''} transition`;
        style = {
          backgroundColor: interpolateCssVars('unpracticed', 'mastered', entry.info.masteryPct / 100),
        };
      }
      if (entry?.status === 'mastered') {
        const bright = key === toggledKey;
        className = `bg-mastered text-black hover:brightness-150 ${bright ? 'brightness-150' : ''} transition`;
      }
      if (entry?.status === 'unpracticed') {
        className = 'text-bg';
      }

      if (entry) {
        const chunk: ColoredChunk = {
          text: ` ${char}`,
          className,
          style,
        };

        if (entry.status !== 'unpracticed') {
            if (isTouch) {
                chunk.onClick = () => setToggledKey(key === toggledKey ? null : key);
            }
            chunk.onMouseEnter = () => setHoveredInfo(entry.info);
            chunk.onMouseLeave = () => setHoveredInfo(null);
        }

        chunks.push(chunk);
      } else {
        chunks.push({ text: ` ${char}`, className });
      }

      chunks.push({ text: '|', className: 'text-fg' });
    }

    chunks.push({ text: '\n' });
    return chunks;
  };

  const legendContent: ColoredChunk[] = makeTextBlock([
    { text: '      new  ', className: 'text-fg font-bold' },
    { text: '   ', className: 'bg-unpracticed text-bg' },
    { text: ' --> ', className: 'text-fg font-bold' },
    { text: '   ', className: 'bg-mastered text-bg' },
    { text: '  mastered', className: 'text-fg font-bold' },
  ]);

  const fretboardContent = useMemo(() => {
    const rows: ColoredChunk[] = [];
    for (let i = 5; i >= 0; i--) {
      rows.push(...rowChunks(tuning[i] ?? 'E', i + 1));
    }
    return makeTextBlock(rows);
  }, [tuning, toggledKey, isTouch]);

  let pctContent: ColoredChunk[] = [
    {
      text: `${isTouch ? 'tap on' : 'hover'} a note for details`,
      className: 'text-fg',
    },
  ];

  if (hoveredInfo) {
    const now = new Date();
    const reviewDate = new Date(hoveredInfo.nextReview);
    let relative = 'unscheduled';

    if (!isNaN(reviewDate.getTime())) {
      const diffMs = reviewDate.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
      if (diffDays === 1) {
        relative = `tomorrow`
      } else if (diffDays < 7) {
        relative = `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
      } else if (diffDays < 30) {
        const weeks = Math.round(diffDays / 7);
        relative = `in ${weeks} week${weeks === 1 ? '' : 's'}`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        relative = `in ${months} month${months === 1 ? '' : 's'}`;
      } else {
        const years = Math.round(diffDays / 365);
        relative = `in ${years} year${years === 1 ? '' : 's'}`;
      }
    }

    pctContent = [
      {
        text: `${hoveredInfo.numPractices} practice${hoveredInfo.numPractices === 1 ? '' : 's'} | ${Math.round(hoveredInfo.masteryPct)}% mastered | next review ${relative}`,
        className: 'text-fg',
      },
    ];
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-6 gap-4">
      <TextBox width={52} height={1} content={legendContent} />
      <TextBox width={52} height={6} content={fretboardContent} />
      <TextBox width={52} height={1} content={pctContent} />
    </div>
  );
}
