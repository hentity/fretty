import React from 'react';
import { ColoredChunk } from '../types';

type TextBoxProps = {
  width: number;    // width in characters
  height: number;   // height in lines
  content: ColoredChunk[];
  className?: string;
};

export const TextBox: React.FC<TextBoxProps> = ({ width, height, content, className }) => {
  const allLines: { chunks: ColoredChunk[]; length: number }[] = [];
  let currentLineChunks: ColoredChunk[] = [];
  let currentLength = 0;

  content.forEach((chunk) => {
    const parts = chunk.text.split('\n');
    parts.forEach((part, idx) => {
      if (idx > 0) {
        allLines.push({ chunks: currentLineChunks, length: currentLength });
        currentLineChunks = [];
        currentLength = 0;
      }

      if (part.length > 0) {
        const manualWidth = chunk.manualWidth ?? part.length;
        currentLineChunks.push({
          ...chunk,
          text: part,
          manualWidth,
        });
        currentLength += manualWidth;
      }
    });
  });

  if (currentLineChunks.length > 0) {
    allLines.push({ chunks: currentLineChunks, length: currentLength });
  }

  if (allLines.length > height) {
    throw new Error(`Content is taller than the specified height (${height} lines).`);
  }

  const topPadding = Math.floor((height - allLines.length) / 2);
  const bottomPadding = height - topPadding - allLines.length;

  return (
    <pre className={"font-mono leading-tight text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl whitespace-pre inline-block p-0 m-0 group cursor-default" + ' ' + className}>
      {/* Top padding */}
      {Array.from({ length: topPadding }).map((_, i) => (
        <div key={`top-pad-${i}`}>&nbsp;</div>
      ))}

      {/* Content */}
      {allLines.map((line, idx) => {
        const hasNoPadding = line.chunks.some((chunk) => chunk.noPadding);
        const lineLength = line.length;
        const leftPad = hasNoPadding ? 0 : Math.floor((width - lineLength) / 2);
        const rightPad = hasNoPadding ? 0 : width - lineLength - leftPad;

        return (
          <div key={idx} className="flex justify-center select-none">
            <span className="flex">
              <span>{' '.repeat(leftPad)}</span>
              {line.chunks.map((chunk, j) => {
                const manualWidth = chunk.manualWidth;
                const spanStyle: React.CSSProperties = {
                  ...chunk.style,
                  display: 'inline-block',
                  width: manualWidth ? `${manualWidth}ch` : undefined,
                  textAlign: manualWidth ? 'center' : undefined,
                  whiteSpace: 'pre', // prevent trimming of whitespace
                };

                return (
                  <span
                    key={j}
                    onClick={chunk.onClick}
                    onMouseEnter={chunk.onMouseEnter}
                    onMouseLeave={chunk.onMouseLeave}
                    style={spanStyle}
                    className={`
                      ${chunk.className || ''}
                      ${chunk.onClick || chunk.onMouseEnter ? 'cursor-pointer' : ''}
                    `}
                  >
                    {chunk.text}
                  </span>
                );
              })}
              <span>{' '.repeat(rightPad)}</span>
            </span>
          </div>
        );
      })}


      {/* Bottom padding */}
      {Array.from({ length: bottomPadding }).map((_, i) => (
        <div key={`bottom-pad-${i}`}>&nbsp;</div>
      ))}
    </pre>
  );
};
