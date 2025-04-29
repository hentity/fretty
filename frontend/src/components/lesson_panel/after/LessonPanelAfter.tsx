import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../../components/TextBox';
import { TextContainer } from '../../../components/TextContainer';
import { makeTextBlock } from '../../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../../../types';

function LessonPanelAfter() {
  const { completedSpots } = useLesson();
  const [content, setContent] = useState<ColoredChunk[]>([]);

  useEffect(() => {
    if (completedSpots.length === 0) {
      setContent(makeTextBlock([
        { text: "No spots reviewed today.", className: 'text-fg' }
      ]));
      return;
    }

    const reviewChunks: ColoredChunk[] = [
      { text: "Lesson Review\n\n", className: 'text-fg font-bold' },
    ];

    completedSpots.forEach((spot) => {
      reviewChunks.push({
        text: `String: ${spot.string}  Note: ${spot.note}\n`,
        className: 'text-fg',
      });
    });

    setContent(makeTextBlock(reviewChunks));
  }, [completedSpots]);

  return (
    <div className="flex justify-center items-start w-full h-full overflow-y-auto">
      <TextContainer width={60} height={12}>
        <div className="flex flex-col items-center justify-center w-full h-full border border-borderDebug">
          <TextBox
            width={40}
            height={21}
            content={content}
          />
        </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelAfter;
