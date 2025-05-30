import { previewLesson } from '../../logic/lessonUtils';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useState } from 'react';
import { ColoredChunk } from '../../types';
import { useLesson } from '../../context/LessonContext';

function LessonPanelBefore() {
  const { progress } = useLesson();

  const [content, setContent] = useState<ColoredChunk[]>([]);

  useEffect(() => {
    if (!progress) {
      setContent(makeTextBlock([
        { text: "Loading progress...", className: 'text-fg' }
      ]));
      return;
    }

    const lessonPreview = previewLesson(progress);

    if (lessonPreview.length === 0) {
      setContent(makeTextBlock([
        { text: "No spots to review today.", className: 'text-fg' }
      ]));
      return;
    }

    const lessonChunks: ColoredChunk[] = [
      { text: "Lesson Preview\n", className: 'text-fg font-bold' },
    ];

    lessonPreview.forEach((spot) => {
      lessonChunks.push({
        text: `String: ${spot.string}  Note: ${spot.note}\n`,
        className: 'text-fg',
      });
    });

    setContent(makeTextBlock(lessonChunks));
  }, [progress]);

  return (
    <div className="flex justify-center items-start w-full h-full overflow-y-auto">
      <TextContainer width={60} height={12}>
        <div className="flex flex-col items-center justify-center w-full h-full">
          <TextBox
            width={60}
            height={12}
            content={content}
          />
          </div>
      </TextContainer>
    </div>
  );
}

export default LessonPanelBefore;
