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
      className="relative overflow-hidden font-mono text-base leading-tight whitespace-pre select-none"
      style={{
        width: `${width}ch`,
        height: `${height}em`, 
      }}
    >
      {children}
    </div>
  );
};
