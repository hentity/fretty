import { ColoredChunk } from '../types';

export function makeTextBlock(
  chunks: ColoredChunk[],
): ColoredChunk[] {
  return chunks.map(chunk => ({
    text: chunk.text,
    onClick: chunk.onClick,
    className: chunk.className,
    noPadding: chunk.noPadding,
  }));
}
