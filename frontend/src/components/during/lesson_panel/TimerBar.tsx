/* timer bar ------------------------------------------------------------------
   waits for the right note (or j-k-l combo) **after** time-out before advancing
   – the bar turns red and stays red until `advance('fail')` is called
-------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { useIntroTour } from '../../../context/IntroTourContext';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import init, { detect_note } from '../../../wasm/audio_processing';
import { playFail } from '../../../logic/sounds';
import { ColoredChunk } from '../../../types';

/* default times (seconds) */
const DEFAULT_TOTAL = 5;
const DEFAULT_EASY  = 1.5;
const DEFAULT_GOOD  = 3;

type Props = {
  totalTime?: number;
  easyTime?:  number;
  goodTime?:  number;
  width?:     number;
};

export default function TimerBar({
  totalTime = DEFAULT_TOTAL,
  easyTime  = DEFAULT_EASY,
  goodTime  = DEFAULT_GOOD,
  width     = 52,
}: Props) {
  /* lesson context */
  const {
    lessonStep,
    advance,
    showFail,
    lessonStatus,
    isPausing,
    isFirstLesson,
    currentSpot,
    setTutorialAllowNext,
    tutorialAllowNext,
    tutorialStep,
  } = useLesson();

  /* intro tour context */
  const { isIntroActive, introStep, introHighlight, setIntroDemoComplete } = useIntroTour();

  /* timer state */
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef  = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* demo timer state (intro tour only) */
  const [demoElapsed, setDemoElapsed] = useState(0);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const DEMO_TARGETS: Record<number, number> = { 4: 0.9, 5: 2.4, 6: 4.0, 7: 5.0 };

  /* ui state */
  const [running,  setRunning]  = useState(false);   // bar growing
  const [failing,  setFailing]  = useState(false);   // bar finished, waiting
  const [noteTxt,  setNoteTxt]  = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [detectionPaused, setDetectionPaused] = useState(false);

  /* audio handles */
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const workletRef   = useRef<AudioWorkletNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const bufferRef    = useRef<Float32Array>(new Float32Array());
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef   = useRef<GainNode | null>(null);
  
  /* trying to gate ambient noise */
  // ---- simple gate (100 ms windows, update on detection tick) ----
  const cutoffRef           = useRef(0.01);                 // current cutoff
  const minWinPeakRef       = useRef<number | null>(null);  // global min of window peaks
  const winPeakRef          = useRef(0);                    // peak within the current 100 ms "window"
  const lastWindowPeakRef   = useRef(0);                    // for logging

  const MULTIPLE = 10;     // cutoff = MULTIPLE × minWinPeak
  const FLOOR    = 0.001;  // absolute floor (~ -60 dBFS)



  /* ---------- timer tick ---------- */
  useEffect(() => {
    if (!running || isPausing) return;

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = +(prev + 0.1).toFixed(1);
        elapsedRef.current = next;
        return next;
      });
    }, 100);

    return () => clearInterval(intervalRef.current!);
  }, [running, isPausing]);

  /* ---------- start / stop timer ---------- */
  useEffect(() => {
    const initial   = (isFirstLesson && lessonStep === 0) || isIntroActive;
    const shouldRun = lessonStatus === 'during' && !initial;

    if (shouldRun) {
      setElapsed(0);
      setAdvancing(false)
      setRunning(true);
      setFailing(false);
      setNoteTxt(' ');
      bufferRef.current = new Float32Array();
    } else {
      setRunning(false);
      setFailing(false);
    }
  }, [lessonStep, lessonStatus, isFirstLesson, isIntroActive]);

  /* ---------- stop growth and flag failure on timeout ---------- */
  useEffect(() => {
    if (!running || isPausing) return;
    if (elapsed >= totalTime) {
      setRunning(false);   // stop bar growth
      setFailing(true);    // paint bar red; wait for note / shortcut
      showFail();
      playFail();
      setDetectionPaused(true);
      setTimeout(() => setDetectionPaused(false), 300);
    }
  }, [elapsed, running, totalTime, isPausing, showFail]);

  /* ---------- intro tour demo animation ---------- */
  useEffect(() => {
    if (!isIntroActive) return;

    // Reset bar on step 7 (static "timer won't run" message) or tour end
    if (introStep === 8 || introStep < 0) {
      clearInterval(demoIntervalRef.current!);
      setDemoElapsed(0);
      return;
    }

    const target = DEMO_TARGETS[introStep];
    if (target === undefined) return; // steps 0, 1, 2 — no animation

    // Steps 3–6: animate from current demoElapsed (cumulative) to target
    clearInterval(demoIntervalRef.current!);
    demoIntervalRef.current = setInterval(() => {
      setDemoElapsed(prev => {
        const next = +(prev + 0.1).toFixed(1);
        if (next >= target) {
          clearInterval(demoIntervalRef.current!);
          setIntroDemoComplete(true);
          return target;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(demoIntervalRef.current!);
  }, [introStep, isIntroActive]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- keyboard shortcut (j + k + l) ---------- */
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeys.add(e.code);
      const keys = ['KeyJ', 'KeyK', 'KeyL'];
      const allPressed = keys.every(code => pressedKeys.has(code));
      if (!allPressed || isPausing || isIntroActive) return;

      const initial = isFirstLesson && lessonStep === 0;
      setRunning(false);   // always stop bar

      /* choose result */
      const result: 'easy' | 'good' | 'hard' | 'fail' =
        failing || elapsed >= totalTime
          ? 'fail'
          : ((): 'easy' | 'good' | 'hard' => {
              const filled = Math.min(width, Math.round((elapsed / totalTime) * width));
              const secAt  = ((filled - 1) / width) * totalTime;
              if (secAt <= easyTime) return 'easy';
              if (secAt <= goodTime) return 'good';
              return 'hard';
            })();

      advance(initial ? null : result);
      setAdvancing(true);
    };

    const onKeyUp = (e: KeyboardEvent) => pressedKeys.delete(e.code);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    failing,
    isPausing,
    elapsed,
    width,
    totalTime,
    easyTime,
    goodTime,
    advance,
    isFirstLesson,
    lessonStep,
  ]);

  function hardStopMic() {
    // step 1: suspend audio context if active
    if (audioCtxRef.current?.state === 'running') {
      audioCtxRef.current.suspend().catch(() => {});
    }
  
    // step 2: disconnect nodes (stop audio flow)
    sourceRef.current?.disconnect();
    sourceRef.current = null;
  
    workletRef.current?.port.close();
    workletRef.current?.disconnect();
    workletRef.current = null;
  
    gainRef.current?.disconnect();
    gainRef.current = null;
  
    // step 3: stop and release media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        t.stop();          // stops the mic
        t.enabled = false;
        streamRef.current!.removeTrack(t);
      });
      streamRef.current = null;
    }
  
    // step 4: close audio context (optional, safe fallback)
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  
    // step 5: internal cleanup
    bufferRef.current = new Float32Array();
    setNoteTxt(' ');
    setRunning(false);
    setFailing(false);
  }

/* ---------- audio setup / teardown ---------- */
useEffect(() => {
  /* when not actively in the lesson, shut everything down */
  if (lessonStatus !== 'during') {
    hardStopMic();
    return;
  }

  /* flag that lets the async setup know we have already left 'during' */
  let cancelled = false;

  (async () => {
    /* ---- STEP 1: wasm init --------------------------------------------- */
    await init();
    if (cancelled) return;

    /* ---- STEP 2: AudioContext ------------------------------------------ */
    const audioCtx = new AudioContext();
    if (cancelled) {
      void audioCtx.close();
      return;
    }
    await audioCtx.resume();
    if (cancelled) {
      void audioCtx.close();
      return;
    }

    /* ---- STEP 3: load worklet ------------------------------------------ */
    const wkUrl = new URL(
      '../../../components/worklet-processor.js',
      import.meta.url,
    ).href;
    await audioCtx.audioWorklet.addModule(wkUrl);
    if (cancelled) {
      void audioCtx.close();
      return;
    }

    /* ---- STEP 4: request microphone ------------------------------------ */
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log('Stream tracks:', stream.getAudioTracks());
    if (cancelled) {
      stream.getTracks().forEach(t => t.stop());
      void audioCtx.close();
      return;
    }

    /* ---- STEP 5: wire graph -------------------------------------------- */
    const source  = audioCtx.createMediaStreamSource(stream);
    const gain    = audioCtx.createGain();
    const worklet = new AudioWorkletNode(audioCtx, 'buffer-processor');
    gain.gain.value = 0;

    source.connect(worklet);
    worklet.connect(gain).connect(audioCtx.destination);

    /* ---- STEP 6: buffer handling --------------------------------------- */
    const sampleRate = audioCtx.sampleRate;
    const maxBufferSize = Math.floor(sampleRate * 0.5); // retain 500ms of audio
    let lastDetection = performance.now();

    worklet.port.onmessage = ({ data }) => {
      if (cancelled) return;

      const inBuf = data as Float32Array;

      // --- gate per sample using the current cutoff; also accumulate window peak ---
      const out = new Float32Array(inBuf.length);
      const cutoff = Math.max(cutoffRef.current ?? FLOOR, FLOOR);

      for (let i = 0; i < inBuf.length; i++) {
        const s = inBuf[i];
        const a = Math.abs(s);

        if (a > winPeakRef.current) winPeakRef.current = a; // track peak within this 100 ms window
        out[i] = a < cutoff ? 0 : s;                        // per-sample gate
      }

      // ---- append gated audio to rolling buffer (unchanged) ----
      const combined = new Float32Array(bufferRef.current.length + out.length);
      combined.set(bufferRef.current);
      combined.set(out, bufferRef.current.length);
      bufferRef.current = combined;

      // keep only the latest 500 ms
      if (bufferRef.current.length > maxBufferSize) {
        bufferRef.current = bufferRef.current.slice(bufferRef.current.length - maxBufferSize);
      }

      // ---- every 100 ms: finalize window, update cutoff, and run detection ----
      const now = performance.now();
      if (now - lastDetection >= 100) {
        lastDetection = now;

        // finalize the current 100 ms window's peak
        const winPeak = Math.max(winPeakRef.current, FLOOR);
        lastWindowPeakRef.current = winPeak;

        // update global minimum window peak
        if (minWinPeakRef.current == null || winPeak < minWinPeakRef.current) {
          minWinPeakRef.current = winPeak;
        }

        // update cutoff for the NEXT 100 ms window
        cutoffRef.current = Math.max(MULTIPLE * (minWinPeakRef.current ?? FLOOR), FLOOR);

        // reset accumulator for the next 100 ms window
        winPeakRef.current = 0;

        // run detection on the latest 500 ms (unchanged)
        if (bufferRef.current.length >= maxBufferSize) {
          const chunk = bufferRef.current.slice(-maxBufferSize);
          const note = detect_note(chunk, sampleRate);
          setNoteTxt(note ?? ' ');
        }
      }

    };


    /* ---- STEP 7: store refs so we can clean up later ------------------- */
    audioCtxRef.current = audioCtx;
    workletRef.current  = worklet;
    streamRef.current   = stream;
    sourceRef.current   = source;
    gainRef.current     = gain;
  })();

  /* cleanup fires when lessonStatus leaves 'during' ----------------------- */
  return () => {
    cancelled = true;    // tells the async setup to bail at the next guard
    hardStopMic();
  };
}, [lessonStatus]);


  /* ---------- auto-advance when correct note is heard ---------- */
  useEffect(() => {
    /* only proceed when listening and we have a note string */
    const listening = running || failing || (isFirstLesson && lessonStep === 0 && !isIntroActive);
    if (!listening || isPausing || detectionPaused || !currentSpot || !noteTxt || lessonStatus !== 'during')
      return;

    if (currentSpot.note.startsWith(noteTxt)) {
      const initial = isFirstLesson && lessonStep === 0;
      const result: 'easy' | 'good' | 'hard' | 'fail' =
        failing ? 'fail' : ((): 'easy' | 'good' | 'hard' => {
          const filled = Math.min(width, Math.round((elapsed / totalTime) * width));
          const secAt  = ((filled - 1) / width) * totalTime;
          if (secAt <= easyTime) return 'easy';
          if (secAt <= goodTime) return 'good';
          return 'hard';
        })();

      setRunning(false);
      if (!isFirstLesson) {
        advance(initial ? null : result);
        setAdvancing(true);
      } else {
        setTutorialAllowNext(true);
      }
    }
  }, [
    noteTxt,
    running,
    failing,
    isPausing,
    currentSpot,
    isFirstLesson,
    lessonStep,
    elapsed,
    width,
    totalTime,
    easyTime,
    goodTime,
    advance,
    lessonStatus,
  ]);

  /* ---------- render progress bar ---------- */
  const displayElapsed = isIntroActive ? demoElapsed : elapsed;
  const demoFailing    = isIntroActive && introStep === 7 && demoElapsed >= 5.0;
  let filled = Math.min(width, Math.round((displayElapsed / totalTime) * width));
  var segments: ColoredChunk[] = []
  if (!isFirstLesson || isIntroActive) {
    segments = Array.from({ length: width }).map((_, i) => {
      const secAt = (i / width) * totalTime;
      let color   = 'text-hard';
      if (secAt <= easyTime) color = 'text-easy';
      else if (secAt <= goodTime) color = 'text-good';
      if (failing || demoFailing) {
        color = 'text-fail';
        filled = 0;
      }
      return { text: i < filled - 1 ? ' ' : '=', className: color };
    });
  }

  const tutorialEncouragements = [
    'Nice work! Click next to continue.',
    'Great job! Click next.',
    'Way to go!',
    'Nice one!',
    'Killing it!',
    "You're goated.",
  ];

  if (advancing && failing) {
    segments.push({text: '\nNext time :)', className: 'text-fg'})
  } else if (tutorialAllowNext) {
    segments.push({ text: `\n${tutorialEncouragements[tutorialStep] ?? tutorialEncouragements[0]}`, className: 'text-good' });
  } else {
    segments.push(
      running || failing || (isFirstLesson && !isIntroActive)
        ? { text: `\nlistening...`, className: 'text-fg' }
        : { text: '\n', className: 'text-fg' },
    );
  }

  const highlighted = isIntroActive && introHighlight === 'timer';
  const dimmed      = isIntroActive && introHighlight !== 'timer';

  return (
    <div className={`transition-all duration-300 ${dimmed ? 'brightness-30' : ''} ${highlighted ? 'bg-stone-900 rounded outline outline-2 outline-stone-500 outline-offset-4 animate-brightness-pulse' : ''}`}>
      <div className="flex flex-col items-center gap-2">
        <TextBox
          width={width}
          height={2}
          content={makeTextBlock([...segments, { text: '' }])}
        />
      </div>
    </div>
  );
}
