import { useState, useEffect, useCallback, useRef } from 'react';
import { IntroTourContext, IntroHighlight } from './IntroTourContext';
import { useLesson } from './LessonContext';

const TOTAL_INTRO_STEPS = 9; // steps 0–8

function highlightForStep(step: number): IntroHighlight {
  if (step === 0) return 'notePanel';
  if (step >= 1 && step <= 2) return 'fretboard';
  if (step >= 3 && step <= 7) return 'timer';
  return null; // step 8 (transition) and inactive (-1)
}

const STEP_RESULT_MAP: Record<number, 'easy' | 'good' | 'hard' | 'fail'> = {
  4: 'easy', 5: 'good', 6: 'hard', 7: 'fail',
};

// Cumulative pip count after each demo step completes
const STEP_PIP_AFTER: Record<number, number> = { 4: 2, 5: 3, 6: 3, 7: 0 };

export const IntroTourProvider = ({ children }: { children: React.ReactNode }) => {
  const { isFirstLesson } = useLesson();

  const [introStep, setIntroStep] = useState(-1);
  const [introDemoComplete, setIntroDemoComplete] = useState(false);
  const [introPipCount, setIntroPipCount] = useState(0);
  const completedRef = useRef(false);

  // Activate intro when the first lesson begins.
  // isFirstLesson starts as false and flips to true inside startLesson(),
  // so we watch it with an effect rather than initialising to 0 at mount.
  useEffect(() => {
    if (isFirstLesson === true && introStep === -1 && !completedRef.current) {
      setIntroStep(0);
    }
  }, [isFirstLesson, introStep]);

  const isIntroActive = introStep >= 0 && introStep < TOTAL_INTRO_STEPS;
  const introHighlight = isIntroActive ? highlightForStep(introStep) : null;

  // Update pip count when a demo animation completes
  useEffect(() => {
    if (!introDemoComplete || !isIntroActive) return;
    const newPips = STEP_PIP_AFTER[introStep];
    if (newPips !== undefined) setIntroPipCount(newPips);
  }, [introDemoComplete, introStep, isIntroActive]);

  // Reset pips when intro ends
  useEffect(() => {
    if (introStep === -1) setIntroPipCount(0);
  }, [introStep]);

  const introResult: 'easy' | 'good' | 'hard' | 'fail' | null =
    (isIntroActive && introDemoComplete) ? (STEP_RESULT_MAP[introStep] ?? null) : null;

  const advanceIntro = useCallback(() => {
    setIntroStep(prev => {
      if (prev < TOTAL_INTRO_STEPS - 1) {
        setIntroDemoComplete(false);
        return prev + 1;
      }
      // last step → deactivate; existing tutorial takes over
      completedRef.current = true;
      return -1;
    });
  }, []);

  return (
    <IntroTourContext.Provider value={{
      isIntroActive,
      introStep,
      introHighlight,
      introDemoComplete,
      setIntroDemoComplete,
      advanceIntro,
      introPipCount,
      introResult,
    }}>
      {children}
    </IntroTourContext.Provider>
  );
};
