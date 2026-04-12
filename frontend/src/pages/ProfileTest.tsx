import { useMemo } from 'react';
import { LessonContext, LessonContextType } from '../context/LessonContext';
import { createDefaultProgress } from '../logic/progressUtils';
import { MASTERED_THRESHOLD } from '../logic/lessonUtils';
import Profile from './Profile';

// string-fret pairs → [interval, num_practices]
// interval >= MASTERED_THRESHOLD (14) = mastered
// interval < 14, num_practices > 0 = learning
// num_practices = 0 = unpracticed
const MOCK_OVERRIDES: Record<string, [number, number]> = {
  // ── mastered ──────────────────────────────────────────────
  '0-3':  [MASTERED_THRESHOLD, 20],  // G  string 1
  '0-5':  [28, 30],                  // A  string 1
  '1-3':  [MASTERED_THRESHOLD, 18],  // C  string 2
  '1-5':  [21, 22],                  // D  string 2
  '2-2':  [18, 16],                  // E  string 3
  '3-5':  [MASTERED_THRESHOLD, 19],  // C  string 4
  '4-5':  [25, 24],                  // E  string 5
  '5-3':  [MASTERED_THRESHOLD, 17],  // G  string 6
  '5-5':  [20, 21],                  // A  string 6

  // ── learning – nearly there (interval 8–13) ───────────────
  '0-7':  [12, 12],  // B  string 1
  '0-8':  [10, 10],  // C  string 1
  '1-7':  [11, 11],  // E  string 2
  '2-5':  [9, 9],    // G  string 3
  '3-2':  [8, 10],   // A  string 4
  '4-1':  [13, 14],  // C  string 5
  '5-12': [10, 11],  // E  string 6

  // ── learning – mid (interval 3–7) ─────────────────────────
  '0-10': [5, 6],    // D  string 1
  '0-12': [4, 5],    // E  string 1
  '1-2':  [6, 7],    // B  string 2
  '1-8':  [3, 4],    // F  string 2
  '2-3':  [7, 8],    // F  string 3
  '2-7':  [4, 5],    // A  string 3
  '3-4':  [5, 6],    // B  string 4
  '3-7':  [3, 4],    // D  string 4
  '4-3':  [6, 7],    // D  string 5
  '4-8':  [5, 6],    // G  string 5
  '5-7':  [4, 5],    // B  string 6
  '5-10': [6, 7],    // D  string 6

  // ── learning – early (interval 1–2) ───────────────────────
  '0-1':  [2, 3],    // F  string 1
  '1-10': [1, 2],    // G  string 2
  '2-9':  [2, 2],    // B  string 3
  '2-10': [1, 1],    // C  string 3
  '3-9':  [2, 3],    // E  string 4
  '4-6':  [1, 2],    // F  string 5
  '4-10': [2, 2],    // A  string 5
  '5-1':  [1, 1],    // F  string 6
  '5-8':  [2, 2],    // C  string 6
};

function buildMockProgress() {
  const progress = createDefaultProgress();
  const today = new Date().toLocaleDateString('sv-SE');

  progress.spots = progress.spots.map(spot => {
    const key = `${spot.string}-${spot.fret}`;
    const override = MOCK_OVERRIDES[key];
    if (!override || spot.status === 'unlearnable') return spot;

    const [interval, num_practices] = override;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + Math.round(interval));
    const reviewDateStr = reviewDate.toLocaleDateString('sv-SE');

    progress.spot_to_review_date[key] = reviewDateStr;
    if (!progress.review_date_to_spots[reviewDateStr]) {
      progress.review_date_to_spots[reviewDateStr] = [];
    }
    progress.review_date_to_spots[reviewDateStr].push(key);

    return {
      ...spot,
      status: interval >= MASTERED_THRESHOLD ? 'review' as const : 'learning' as const,
      interval,
      num_practices,
      good_attempts: 3,
      is_new: false,
    };
  });

  progress.new = false;
  progress.last_review_date = today;

  return progress;
}

const NOOP = () => {};

export default function ProfileTest() {
  const mockProgress = useMemo(() => buildMockProgress(), []);

  const mockCtx: LessonContextType = {
    lessonStatus: 'before',
    setLessonStatus: NOOP as never,
    lessonQueue: [],
    lessonStep: 0,
    completedSpots: [],
    currentSpot: null,
    result: null,
    startLesson: NOOP,
    endLesson: NOOP as never,
    advance: NOOP,
    advanceDay: NOOP,
    progress: mockProgress,
    highlight: null,
    highlightSpot: NOOP,
    isPausing: false,
    isFirstLesson: false,
    tutorialStep: 0,
    setTutorialStep: NOOP as never,
    tutorialQueue: [],
    today: new Date().toLocaleDateString('sv-SE'),
    loading: false,
    showFail: NOOP,
    tutorialAllowNext: false,
    setTutorialAllowNext: NOOP as never,
    practiceAgain: NOOP,
    isPracticeAgain: false,
    postPractice: false,
    setPostPractice: NOOP as never,
  };

  return (
    <LessonContext.Provider value={mockCtx}>
      <Profile />
    </LessonContext.Provider>
  );
}
