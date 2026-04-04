import { useEffect } from 'react';
import LessonPanelAfter from './LessonPanelAfter';
import { playLessonComplete } from '../../logic/sounds';

export default function After() {
  useEffect(() => {
    playLessonComplete();
  }, []);

  return (
    <>
      <div className="h-full flex justify-center ">
        <LessonPanelAfter />
      </div>
    </>
  )
}