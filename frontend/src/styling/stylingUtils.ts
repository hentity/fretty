import { ColoredChunk } from '../types';

export function makeTextBlock(
  chunks: ColoredChunk[],
): ColoredChunk[] {
  return chunks.map(chunk => ({
    text: chunk.text,
    onClick: chunk.onClick,
    onMouseEnter: chunk.onMouseEnter,
    onMouseLeave: chunk.onMouseLeave,
    style: chunk.style,
    className: chunk.className,
    noPadding: chunk.noPadding,
    manualWidth: chunk.manualWidth,
  }));
}

export function interpolateColor(progress: number): string {
  const red = [224, 149, 62];
  const yellow = [106, 153, 78];
  const green = [84, 152, 171];

  let from: number[], to: number[], t: number;

  if (progress < 0.5) {
    from = red;
    to = yellow;
    t = progress / 0.5;
  } else {
    from = yellow;
    to = green;
    t = (progress - 0.5) / 0.5;
  }

  const rgb = from.map((start, i) => Math.round(start + t * (to[i] - start)));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

export function getCssVarRgb(name: string): number[] {
  const varName = `--color-${name}`;
  const hex = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}
