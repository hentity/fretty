import { ColoredChar, ColoredChunk } from '../types';

export function makeTextBlock(
  chunks: ColoredChunk[],
  defaultFgColor: string = 'var(--color-textDark)',
  defaultBgColor: string = 'var(--color-primaryDark)'
): ColoredChar[][] {
  const lines: ColoredChar[][] = [[]]; // start with one empty line

  for (const chunk of chunks) {
    const fg = chunk.fgColor || defaultFgColor;
    const bg = chunk.bgColor || defaultBgColor;
    
    const chunkLines = chunk.text.split('\n');
    
    chunkLines.forEach((chunkLine, idx) => {
      if (idx > 0) {
        // If it's not the first line, start a new line in the output
        lines.push([]);
      }
      for (const char of chunkLine) {
        lines[lines.length - 1].push({ char, fgColor: fg, bgColor: bg });
      }
    });
  }

  return lines;
}