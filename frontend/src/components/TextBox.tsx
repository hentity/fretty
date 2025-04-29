import React from 'react';
import { ColoredChunk } from '../types';

type TextBoxProps = {
  width: number;    // width in characters
  height: number;   // height in lines
  content: ColoredChunk[];
};

export const TextBox: React.FC<TextBoxProps> = ({ width, height, content }) => {
  // Break content into visual lines based on \n
  const allLines: { chunks: ColoredChunk[]; length: number }[] = [];
  let currentLineChunks: ColoredChunk[] = [];
  let currentLength = 0;

  content.forEach((chunk) => {
    const parts = chunk.text.split('\n');

    parts.forEach((part, idx) => {
      if (idx > 0) {
        // Push current line if there was a \n
        allLines.push({ chunks: currentLineChunks, length: currentLength });
        currentLineChunks = [];
        currentLength = 0;
      }
      if (part.length > 0) {
        currentLineChunks.push({
          text: part,
          onClick: chunk.onClick,
          className: chunk.className,
        });
        currentLength += part.length;
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

  const leftPadding = (lineLength: number) => Math.floor((width - lineLength) / 2);
  const rightPadding = (lineLength: number) => width - lineLength - leftPadding(lineLength);

  return (
    <pre className="font-mono text-base text-xl whitespace-pre inline-block p-0 m-0 group cursor-default">
      {/* Top padding */}
      {Array.from({ length: topPadding }).map((_, i) => (
        <div key={`top-pad-${i}`}>&nbsp;</div>
      ))}

      {/* Actual content */}
      {allLines.map((line, idx) => (
        <div key={idx} className="flex justify-center select-none">
          <span className="flex">
            <span>{' '.repeat(leftPadding(line.length))}</span>
            {line.chunks.map((chunk, j) => (
              <span
                key={j}
                onClick={chunk.onClick}
                className={`
                  ${chunk.className || ''}
                  ${chunk.onClick ? 'cursor-pointer' : ''}
                `}
              >
                {chunk.text}
              </span>
            ))}
            <span>{' '.repeat(rightPadding(line.length))}</span>
          </span>
        </div>
      ))}

      {/* Bottom padding */}
      {Array.from({ length: bottomPadding }).map((_, i) => (
        <div key={`bottom-pad-${i}`}>&nbsp;</div>
      ))}
    </pre>
  );
};
