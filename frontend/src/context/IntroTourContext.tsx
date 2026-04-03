import { createContext, useContext } from 'react';

export type IntroHighlight = 'notePanel' | 'fretboard' | 'timer' | null;

export type IntroTourContextType = {
  isIntroActive: boolean;
  introStep: number;            // -1 = inactive, 0–8 = active
  introHighlight: IntroHighlight;
  introDemoComplete: boolean;   // timer animation has reached its target
  setIntroDemoComplete: (v: boolean) => void;
  advanceIntro: () => void;
  introPipCount: number;        // cumulative pip count shown in note panel during demo
  introResult: 'easy' | 'good' | 'hard' | 'fail' | null; // result for current demo step (set when demo completes)
};

export const IntroTourContext = createContext<IntroTourContextType | undefined>(undefined);

export const useIntroTour = () => {
  const ctx = useContext(IntroTourContext);
  if (!ctx) throw new Error('useIntroTour must be used within an IntroTourProvider');
  return ctx;
};
