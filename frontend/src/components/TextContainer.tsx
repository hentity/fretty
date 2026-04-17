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
      className="relative flex justify-center items-center font-mono leading-tight text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl whitespace-pre select-none"
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
