import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../../components/TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';

function LessonProgress() {
  const { completedSpots, lessonQueue } = useLesson();

  const totalSpots = completedSpots.length + lessonQueue.length + 1;
  const reviewedCount = completedSpots.length;

  const content = makeTextBlock([
    { text: `${reviewedCount} / ${totalSpots} spots reviewed`, className: 'text-primaryLight font-bold' }
  ]);

  return (
    <TextBox
      width={80}
      height={3}
      content={content}
    />
  );
}

export default LessonProgress;
