import { NOTE_TO_FREQUENCY } from './noteUtils';

let ctx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -6;
    compressor.knee.value = 6;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.1;
    compressor.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function beep(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'square',
  startTime: number = 0,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime + startTime);

  gain.gain.setValueAtTime(0, ac.currentTime + startTime);
  gain.gain.linearRampToValueAtTime(volume, ac.currentTime + startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(compressor!);

  osc.start(ac.currentTime + startTime);
  osc.stop(ac.currentTime + startTime + duration);
}

// Get frequency for a note in octave 3, falling back to C3 if not found
function noteFreq(note: string, _octave: number): number {
  return NOTE_TO_FREQUENCY[`${note}3`] ?? NOTE_TO_FREQUENCY['C3'];
}

const MAJOR_THIRD = 2 ** (4 / 12);
const FIFTH      = 2 ** (7 / 12);
const OCTAVE     = 2;

export function playEasy(note: string, octave: number) {
  const root = noteFreq(note, octave);
  beep(root, 0.08, 0.12);
  beep(root * MAJOR_THIRD, 0.08, 0.11, 'square', 0.07);
  beep(root * FIFTH, 0.09, 0.10, 'square', 0.14);
}

export function playGood(note: string, octave: number) {
  const root = noteFreq(note, octave);
  beep(root, 0.08, 0.12);
  beep(root * MAJOR_THIRD, 0.09, 0.10, 'square', 0.07);
}

export function playHard(note: string, octave: number) {
  const root = noteFreq(note, octave);
  beep(root, 0.08, 0.10);
  beep(root, 0.08, 0.10, 'square', 0.09);
}

export function playFail() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(300, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.25);

  gain.gain.setValueAtTime(0.14, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.25);
}

export function playNoteComplete(note: string, octave: number) {
  const root = noteFreq(note, octave);
  [root, root * MAJOR_THIRD, root * FIFTH, root * OCTAVE].forEach((freq, i) =>
    beep(freq, 0.12, 0.13, 'square', i * 0.09)
  );
}

export async function playLessonComplete() {
  const ac = getCtx();
  if (ac.state === 'suspended') await ac.resume();
  const melody = [523, 659, 784, 1047]; // C major fanfare as a fixed flourish
  melody.forEach((freq, i) => beep(freq, 0.14, 0.13, 'square', i * 0.11));
  beep(1047 * OCTAVE, 0.5, 0.10, 'square', melody.length * 0.11);
}
