import { useLesson } from '../../context/LessonContext';
import { TextBox } from '../TextBox';
import { TextContainer } from '../TextContainer';
import { makeTextBlock } from '../../styling/stylingUtils';
import { useEffect, useRef, useState } from 'react';
import { ColoredChunk, Spot } from '../../types';
import { MASTERED_THRESHOLD, spotKey } from '../../logic/lessonUtils';
import LessonCompleteText from '../before/LessonComplete';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';
import { schedulePracticeReminders } from '../../logic/reminderUtils';
import PracticeSelector from './PracticeSelector';
import Profile from '../../pages/Profile';
import IntroText from '../before/IntroText';
import LessonPreviewFretboard from '../before/LessonPreviewFretboard';
import MasteryComplete from './MasteryComplete';

const BAR_WIDTH = 20;
const REMINDERS_PREF_KEY = 'practiceRemindersEnabled';
const MASTERY_COMPLETE_PREF_KEY = 'masteryCompleteShown';
const MONO = 'font-mono text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl';

type Tab = 'stats' | 'practice' | 'progress';
type Phase = 'idle' | 'preview' | 'countdown';

function LessonPanelAfter({ showIntro = false }: { showIntro?: boolean }) {
  const {
    progress, today, practiceAgain, postPractice, setPostPractice,
    startLesson, prepareLesson, pendingLesson, pendingReviewKeys,
  } = useLesson();

  const [noteChunks, setNoteChunks] = useState<ColoredChunk[]>([]);
  const [masteryChunks, setMasteryChunks] = useState<ColoredChunk[]>([]);
  const [reviewChunks, setReviewChunks] = useState<ColoredChunk[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('stats');

  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(3);
  const streamRef = useRef<MediaStream | null>(null);
  const [lockedMsg, setLockedMsg] = useState(false);
  const [micError, setMicError] = useState(false);
  const [showMasteryComplete, setShowMasteryComplete] = useState(false);
  const lockedMsgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAfter = progress?.last_review_date === today;
  const isFirstLesson = (progress?.new ?? false) && (progress?.spots.every(s => s.is_new) ?? false);
  const completedSpots = progress?.recentSpots ?? [];

  const learnableSpots = progress?.spots.filter(s => s.status !== 'unlearnable') ?? [];
  const allMastered = learnableSpots.length > 0 && learnableSpots.every(s => s.interval >= MASTERED_THRESHOLD);

  const newCount    = pendingLesson.filter(s => !pendingReviewKeys.has(`${s.string}-${s.fret}`)).length;
  const reviewCount = pendingLesson.filter(s =>  pendingReviewKeys.has(`${s.string}-${s.fret}`)).length;
  const hasLesson   = isFirstLesson || pendingLesson.length > 0;

  const nextReviewDate = !hasLesson && progress
    ? Object.keys(progress.review_date_to_spots).sort().find(d => d > today) ?? null
    : null;

  const nextReviewLabel = (() => {
    if (!nextReviewDate) return null;
    const d = new Date(nextReviewDate + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  })();

  // Populate pendingLesson on mount when in before mode (not needed for tutorial)
  useEffect(() => {
    if (!isAfter && !isFirstLesson) {
      prepareLesson();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch to practice tab after a practice session
  useEffect(() => {
    if (postPractice) {
      setActiveTab('practice');
      setPostPractice(false);
    }
  }, [postPractice, setPostPractice]);

  // Countdown tick
  useEffect(() => {
    if (phase !== 'countdown' || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, remaining]);

  // Launch lesson when countdown hits zero
  useEffect(() => {
    if (phase === 'countdown' && remaining <= 0) startLesson();
  }, [phase, remaining, startLesson]);

  // Check reminders pref on mount — show modal if never asked and lesson is done.
  // Use a ref so the async callback always reads the latest isAfter value.
  const isAfterRef = useRef(false);
  isAfterRef.current = isAfter;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (Capacitor.getPlatform() === 'web') return;
      if (!isAfterRef.current) return;
      const { value } = await Preferences.get({ key: REMINDERS_PREF_KEY });
      if (value === null) {
        timer = setTimeout(() => setShowReminderModal(true), 1500);
      }
    };
    check();
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show mastery complete screen once per tuning when all notes are mastered
  const allMasteredRef = useRef(false);
  allMasteredRef.current = allMastered;
  const tuningKey = progress?.tuning.join(',') ?? '';
  useEffect(() => {
    if (!tuningKey) return;
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      if (!allMasteredRef.current) return;
      const key = `${MASTERY_COMPLETE_PREF_KEY}_${tuningKey}`;
      let seen: string | null = null;
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        seen = value;
      } else {
        seen = localStorage.getItem(key);
      }
      if (!seen) {
        timer = setTimeout(() => setShowMasteryComplete(true), 1000);
      }
    };
    check();
    return () => clearTimeout(timer);
  }, [tuningKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMasteryDismiss = async () => {
    setShowMasteryComplete(false);
    const key = `${MASTERY_COMPLETE_PREF_KEY}_${tuningKey}`;
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: 'true' });
    } else {
      localStorage.setItem(key, 'true');
    }
  };

  const handleReminderYes = async () => {
    setShowReminderModal(false);
    const { display } = await LocalNotifications.requestPermissions();
    if (display === 'granted') {
      await Preferences.set({ key: REMINDERS_PREF_KEY, value: 'true' });
      await schedulePracticeReminders(progress!);
    } else {
      await Preferences.set({ key: REMINDERS_PREF_KEY, value: 'false' });
    }
  };

  const handleReminderNo = async () => {
    setShowReminderModal(false);
    await Preferences.set({ key: REMINDERS_PREF_KEY, value: 'false' });
  };

  // Build after-mode stats chunks
  useEffect(() => {
    if (!isAfter || !progress) return;

    if (completedSpots.length === 0) {
      setNoteChunks(makeTextBlock([{ text: 'no spots reviewed today.', className: 'text-fg' }]));
      setMasteryChunks([]);
      setReviewChunks([]);
      return;
    }

    const noteLines: ColoredChunk[] = [{ text: 'note\n', className: 'text-fg font-bold pb-1', noPadding: true }];
    const masteryLines: ColoredChunk[] = [{ text: 'mastery\n', className: 'text-fg font-bold pb-1', noPadding: true }];
    const reviewLines: ColoredChunk[] = [{ text: 'next review\n', className: 'text-fg font-bold pb-1', noPadding: true }];

    completedSpots.forEach((spot) => {
      const key = spotKey(spot);
      const reviewDate = progress.spot_to_review_date[key] ?? 'unscheduled';
      const fraction = Math.min(Math.log(spot.interval + 0.2) / Math.log(MASTERED_THRESHOLD + 0.2), 1);
      const percent = String(Math.round(fraction * 100)).padStart(3, ' ');
      const filled = Math.round(fraction * BAR_WIDTH);
      const empty = BAR_WIDTH - filled;

      noteLines.push({ text: `${spot.note}, string ${spot.string + 1}\n`, className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: '#'.repeat(filled), className: 'text-easy font-bold brightness-100' });
      masteryLines.push({ text: '-'.repeat(empty), className: 'text-fg brightness-80' });
      masteryLines.push({ text: '|', className: 'text-fg brightness-80' });
      masteryLines.push({ text: ` ${percent}%\n`, className: 'text-fg brightness-80' });
      reviewLines.push({
        text: (() => {
          const now = new Date();
          const d = new Date(`${reviewDate}T00:00:00`);
          let rel = 'unscheduled';
          if (!isNaN(d.getTime())) {
            const days = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (days === 1)       rel = 'tomorrow';
            else if (days < 7)   rel = `in ${days} days`;
            else if (days < 30)  rel = `in ${Math.round(days / 7)} week${Math.round(days / 7) === 1 ? '' : 's'}`;
            else if (days < 365) rel = `in ${Math.round(days / 30)} month${Math.round(days / 30) === 1 ? '' : 's'}`;
            else                 rel = `in ${Math.round(days / 365)} year${Math.round(days / 365) === 1 ? '' : 's'}`;
          }
          return `${rel}\n`;
        })(),
        className: 'text-fg brightness-80',
      });
    });

    setNoteChunks(makeTextBlock(noteLines));
    setMasteryChunks(makeTextBlock(masteryLines));
    setReviewChunks(makeTextBlock(reviewLines));
  }, [completedSpots, progress, isAfter]);

  const height = completedSpots.length + 1;

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (isFirstLesson) {
        startLesson();
      } else {
        setPhase('preview');
      }
    } catch {
      setMicError(true);
    }
  };

  const handleContinue = () => {
    setRemaining(3);
    setPhase('countdown');
  };

  const showLockedMsg = () => {
    setLockedMsg(true);
    if (lockedMsgTimer.current) clearTimeout(lockedMsgTimer.current);
    lockedMsgTimer.current = setTimeout(() => setLockedMsg(false), 2000);
  };

  if (phase === 'countdown') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <TextBox
          width={20}
          height={3}
          content={[{ text: `starting in ${remaining}...`, className: 'text-fg font-bold' }]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-y-auto gap-2 ">

      {/* mastery complete */}
      {showMasteryComplete && (
        <MasteryComplete onDismiss={handleMasteryDismiss} />
      )}

      {/* reminders modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80">
          <div className={`${MONO} flex flex-col items-center gap-5 outline outline-2 outline-fg bg-bg px-10 py-8`}>
            <span className="text-fg font-bold">enable practice reminders?</span>
            <span className="text-fg/50">get a daily nudge to keep your streak going</span>
            <div className="flex gap-4 mt-1">
              <button
                onClick={handleReminderYes}
                className="bg-fg text-bg font-bold px-6 py-1 hover:brightness-75 active:brightness-60 transition cursor-pointer"
              >
                yes please
              </button>
              <button
                onClick={handleReminderNo}
                className="text-fg/40 px-6 py-1 hover:text-fg transition cursor-pointer"
              >
                no thanks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* segmented toggle + content — wrapper is what gets centered */}
      <div className="relative flex flex-col items-center gap-2 w-full max-w-full px-4">

      {/* locked tab message — absolutely positioned above toggle */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 ">
        <div className={`${MONO} bg-fail text-bg font-bold px-4 py-0.5 whitespace-nowrap transition-opacity duration-500 ${lockedMsg ? 'opacity-100' : 'opacity-0'}`}>
          complete a lesson first
        </div>
      </div>

      {/* segmented toggle */}
      <div className={`${MONO} relative py-0.5 flex cursor-pointer select-none overflow-hidden outline outline-2 outline-fg w-full max-w-[34rem] xl:max-w-[42rem] 2xl:max-w-[50rem]`}>
        <div
          className="absolute inset-0 w-1/3 bg-fg transition-transform duration-300 ease-in-out"
          style={{
            transform: activeTab === 'practice' ? 'translateX(100%)' : activeTab === 'progress' ? 'translateX(200%)' : 'translateX(0)',
          }}
        />
        <button
          onClick={() => setActiveTab('stats')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'stats' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'}`}
        >
          daily lesson
          {!isAfter && activeTab !== 'stats' && (
            <span className="relative inline-flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
              <span className="relative text-good">●</span>
            </span>
          )}
        </button>
        <button
          onClick={() => { if (!isFirstLesson) setActiveTab('practice'); else showLockedMsg(); }}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'practice' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'} ${isFirstLesson ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          practice lesson
        </button>
        <button
          onClick={() => { if (!isFirstLesson) setActiveTab('progress'); else showLockedMsg(); }}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 font-bold px-4 whitespace-nowrap transition-colors duration-300 ${activeTab === 'progress' ? 'text-bg' : 'text-fg brightness-60 hover:brightness-80'} ${isFirstLesson ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          my progress
        </button>
      </div>

      {/* content — all panels share the same grid cell so height = tallest */}
      <div className="grid items-start ">

        {/* daily lesson tab */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex flex-col items-center gap-1 transition-opacity duration-200 ${activeTab !== 'stats' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          {isAfter ? (
            <>
              <div className="pt-2">
                <TextBox width={30} height={1} content={makeTextBlock([{ text: 'DAILY LESSON COMPLETE!', className: 'text-fg font-bold' }])} />
              </div>
              {completedSpots.length > 0 ? (
                <TextContainer width={65} height={height + 1}>
                  <div className="flex flex-row items-center justify-center w-full h-full">
                    <TextBox width={18} height={height} content={noteChunks} />
                    <TextBox width={27} height={height} content={masteryChunks} />
                    <TextBox width={18} height={height} content={reviewChunks} />
                  </div>
                </TextContainer>
              ) : (
                <LessonCompleteText />
              )}
              <TextBox width={60} height={1} content={[{ text: 'see you tomorrow :)', className: 'text-fg' }]} />
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {showIntro && <IntroText />}
              {phase === 'preview' ? (
                <LessonPreviewFretboard onContinue={handleContinue} />
              ) : (
                <>
                  {hasLesson && !isFirstLesson && (
                    <div className={`${MONO} flex items-baseline gap-3 mt-2`}>
                      <span>
                        <span className="text-good font-bold">{newCount}</span>
                        <span className="text-fg/50"> new {newCount === 1 ? 'note' : 'notes'}</span>
                      </span>
                      <span className="text-fg/30">·</span>
                      {reviewCount > 0 && (
                        <span>
                          <span className="text-mastered font-bold">{reviewCount}</span>
                          <span className="text-fg/50"> {reviewCount === 1 ? 'note' : 'notes'} to review</span>
                        </span>
                      )}
                    </div>
                  )}
                  {micError && (
                    <div className={`${MONO} outline outline-2 outline-easy px-8 py-4 flex flex-col items-center gap-1 mt-4`}>
                      <span className="text-fg/50">Microphone access is required.</span>
                      <span className="text-fg/50">Please enable it in <a href="app-settings:" className="text-fg font-bold underline">Settings</a></span>
                    </div>
                  )}
                  {hasLesson ? (
                    <button
                      onClick={handleStart}
                      className={`${MONO} bg-good text-bg font-bold px-10 py-4 hover:brightness-75 active:brightness-60 transition cursor-pointer`}
                    >
                      {isFirstLesson ? 'start tutorial' : 'start lesson'}
                    </button>
                  ) : (
                    <div className={`${MONO} outline outline-2 outline-easy px-8 py-4 flex flex-col items-center gap-1 mt-4`}>
                      <span className="text-fg/50">nothing to review today!</span>
                      {nextReviewLabel && (
                        <span className="text-fg/50">next review  <span className="text-fg font-bold">{nextReviewLabel}</span></span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* practice tab */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex items-start justify-center transition-opacity duration-200 ${activeTab !== 'practice' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="pt-2"><PracticeSelector onStart={(spots: Spot[]) => practiceAgain(spots)} /></div>
        </div>

        {/* progress tab */}
        <div
          style={{ gridArea: '1/1' }}
          className={`flex items-start justify-center transition-opacity duration-200 ${activeTab !== 'progress' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="pt-2"><Profile /></div>
        </div>

      </div>

      </div>{/* end centered wrapper */}
    </div>
  );
}

export default LessonPanelAfter;
