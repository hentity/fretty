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
      className="relative flex justify-center items-center font-mono text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl whitespace-pre select-none"
      style={{
        width: '100%',
        maxWidth: `${width}ch`,
        height: `calc(${height} * 1lh)`,
        margin: '0 auto', // horizontal centering fallback
      }}
    >
      {children}
    </div>
  );
};
