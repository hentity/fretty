// TextContainer.tsx
import React from 'react';

type TextContainerProps = {
  width: number;  // in characters
  height: number; // in lines
  children: React.ReactNode;
};

export const TextContainer: React.FC<TextContainerProps> = ({ width, height, children }) => {
  return (
    <div
      className="relative justify-center items-center font-mono text-base text-xl whitespace-pre select-none"
      style={{
        width: `${width}ch`,
        height: `calc(${height} * 1lh)`,
      }}
    >
      {children}
    </div>
  );
};
