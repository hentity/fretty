/* timer bar ------------------------------------------------------------------
   waits for the right note (or j-k-l combo) **after** time-out before advancing
   – the bar turns red and stays red until `advance('fail')` is called
-------------------------------------------------------------------------------*/

import { useEffect, useRef, useState } from 'react';
import { useLesson } from '../../../context/LessonContext';
import { TextBox } from '../../TextBox';
import { makeTextBlock } from '../../../styling/stylingUtils';
import init, { detect_note } from '../../../wasm/audio_processing';

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
  } = useLesson();

  /* timer state */
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef  = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ui state */
  const [running,  setRunning]  = useState(false);   // bar growing
  const [failing,  setFailing]  = useState(false);   // bar finished, waiting
  const [noteTxt,  setNoteTxt]  = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  /* audio handles */
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const workletRef   = useRef<AudioWorkletNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const bufferRef    = useRef<Float32Array>(new Float32Array());

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
    const initial   = isFirstLesson && lessonStep === 0;
    const shouldRun = lessonStatus === 'during' && !initial;

    if (shouldRun) {
      setElapsed(0);
      setAdvancing(false)
      setRunning(true);
      setFailing(false);
      setNoteTxt(null);
      bufferRef.current = new Float32Array();
    } else {
      setRunning(false);
      setFailing(false);
    }
  }, [lessonStep, lessonStatus, isFirstLesson]);

  /* ---------- stop growth and flag failure on timeout ---------- */
  useEffect(() => {
    if (!running || isPausing) return;
    if (elapsed >= totalTime) {
      setRunning(false);   // stop bar growth
      setFailing(true);    // paint bar red; wait for note / shortcut
      showFail();
    }
  }, [elapsed, running, totalTime, isPausing, showFail]);

  /* ---------- keyboard shortcut (j + k + l) ---------- */
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      pressedKeys.add(e.code);
      const keys = ['KeyJ', 'KeyK', 'KeyL'];
      const allPressed = keys.every(code => pressedKeys.has(code));
      if (!allPressed || isPausing) return;

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

  /* ---------- audio setup / teardown ---------- */
  useEffect(() => {
    const initial = isFirstLesson && lessonStep === 0;
    const active  = lessonStatus === 'during' || initial;
    if (!active) return;

    let stopped = false;

    (async () => {
      await init();

      /* audio context */
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      /* worklet */
      const url = new URL('../../../components/worklet-processor.js', import.meta.url).href;
      await audioCtx.audioWorklet.addModule(url);
      const worklet = new AudioWorkletNode(audioCtx, 'buffer-processor');

      /* microphone */
      const stream  = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source  = audioCtx.createMediaStreamSource(stream);
      const gain    = audioCtx.createGain();
      source.connect(worklet);
      gain.gain.value = 0;
      worklet.connect(gain).connect(audioCtx.destination); // muted path

      /* buffer size */
      const chunkSec  = 0.5;
      const chunkSize = Math.floor(audioCtx.sampleRate * chunkSec);

      /* onmessage */
      worklet.port.onmessage = ({ data }) => {
        if (stopped) return;

        const inBuf      = data as Float32Array;
        const combined   = new Float32Array(bufferRef.current.length + inBuf.length);
        combined.set(bufferRef.current);
        combined.set(inBuf, bufferRef.current.length);
        bufferRef.current = combined;

        if (bufferRef.current.length >= chunkSize) {
          const chunk = bufferRef.current.slice(0, chunkSize);
          bufferRef.current = bufferRef.current.slice(chunkSize);

          const note = detect_note(chunk, audioCtx.sampleRate);
          setNoteTxt(note ?? '—');
        }
      };

      /* keep refs */
      audioCtxRef.current = audioCtx;
      workletRef.current  = worklet;
      streamRef.current   = stream;
    })();

    /* cleanup */
    return () => {
      stopped = true;
      clearInterval(intervalRef.current!);

      workletRef.current?.port.close();
      workletRef.current?.disconnect();
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioCtxRef.current?.close();

      audioCtxRef.current = null;
      workletRef.current  = null;
      streamRef.current   = null;
      bufferRef.current   = new Float32Array();
      setNoteTxt(null);
      setRunning(false);
      setFailing(false);
    };
  }, [lessonStatus, isFirstLesson, lessonStep]);

  /* ---------- auto-advance when correct note is heard ---------- */
  useEffect(() => {
    /* only proceed when listening and we have a note string */
    const listening = running || failing || (isFirstLesson && lessonStep === 0);
    if (!listening || isPausing || !currentSpot || !noteTxt || lessonStatus !== 'during')
      return;

    if (noteTxt.startsWith(currentSpot.note)) {
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
      advance(initial ? null : result);
      setAdvancing(true);
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
  let filled = Math.min(width, Math.round((elapsed / totalTime) * width));
  const segments = Array.from({ length: width }).map((_, i) => {
    const secAt = (i / width) * totalTime;
    let color   = 'text-hard';
    if (secAt <= easyTime) color = 'text-easy';
    else if (secAt <= goodTime) color = 'text-good';
    if (failing) {
      color = 'text-fail';
      filled = 0;
    }
    return { text: i < filled - 1 ? ' ' : '=', className: color };
  });

  if (advancing && failing) {
    segments.push({text: '\nNext time :)', className: 'text-fg'})
  } else {
    segments.push(
      running || failing || isFirstLesson
        ? { text: '\nlistening...', className: 'text-fg' }
        : { text: '\n', className: 'text-fg' },
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <TextBox
        width={width}
        height={2}
        content={makeTextBlock([...segments, { text: '' }])}
      />
    </div>
  );
}
