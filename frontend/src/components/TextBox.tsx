import React from 'react';
import { ColoredChar } from '../types';

type TextBoxProps = {
  width: number;      // in characters
  height: number;     // in lines
  content: ColoredChar[][];  // 2D array: lines of characters
  border?: boolean;
};

export const TextBox: React.FC<TextBoxProps> = ({ width, height, content, border = false }) => {
  if (content.some(line => line.length > width)) {
    throw new Error(`Content is wider than the specified width (${width}).`);
  }
  if (content.length > height) {
    throw new Error(`Content is taller than the specified height (${height}).`);
  }
  
  // Helper to create an empty line
  const createEmptyLine = (): ColoredChar[] => Array(width).fill({ char: ' ' });

  // Build content padded to width x height
  let paddedContent: ColoredChar[][] = [];

  // Center content
  const contentHeight = content.length;
  const topPadding = Math.floor((height - contentHeight) / 2);
  const bottomPadding = height - topPadding - contentHeight;

  for (let i = 0; i < topPadding; i++) {
    paddedContent.push(createEmptyLine());
  }
  for (const line of content) {
    const lineLength = line.length;
    const leftPadding = Math.floor((width - lineLength) / 2);
    const rightPadding = width - leftPadding - lineLength;
    paddedContent.push([
      ...Array(leftPadding).fill({ char: ' ' }),
      ...line,
      ...Array(rightPadding).fill({ char: ' ' }),
    ]);
  }
  for (let i = 0; i < bottomPadding; i++) {
    paddedContent.push(createEmptyLine());
  }

  // Build the border if needed
  let finalContent: ColoredChar[][] = [];
  if (border) {
    const topBorder = [
      { char: '┌' },
      ...Array(width).fill({ char: '─' }),
      { char: '┐' }
    ];
    const bottomBorder = [
      { char: '└' },
      ...Array(width).fill({ char: '─' }),
      { char: '┘' }
    ];
    finalContent.push(topBorder);
    for (const line of paddedContent) {
      finalContent.push([
        { char: '│' },
        ...line,
        { char: '│' }
      ]);
    }
    finalContent.push(bottomBorder);
  } else {
    finalContent = paddedContent;
  }

  const defaultTextColor = 'var(--color-textDark)';
  const defaultBackgroundColor = 'var(--color-primaryDark)';

  // Render as <pre> preserving spacing
  return (
    <pre className="font-mono text-base leading-tight whitespace-pre inline-block bg-primaryDark p-0 m-0">
    {finalContent.map((line, y) => (
      <div key={y} className="flex">
        {line.map((coloredChar, x) => (
          <span
            key={x}
            style={{
              color: coloredChar.fgColor || defaultTextColor,
              backgroundColor: coloredChar.bgColor || defaultBackgroundColor,
            }}
          >
            {coloredChar.char}
          </span>
        ))}
      </div>
    ))}
  </pre>
  );
};
