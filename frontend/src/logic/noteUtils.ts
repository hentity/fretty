export const NOTE_TO_FREQUENCY: Record<string, number> = {
  "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50,
  "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81,
  "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00,
  "A#3": 233.08, "B3": 246.94, "C4": 261.63, "C#4": 277.18, "D4": 293.66,
  "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00,
  "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88, "C5": 523.25,
  "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46,
  "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33,
  "B5": 987.77,
}

const NOTES = Object.keys(NOTE_TO_FREQUENCY)

export function spotToNote(string: number, fret: number, tuning: string[]): { note: string, octave: number } {
  const openNote = tuning[string]
  const openNoteIndex = NOTES.indexOf(openNote)
  const noteIndex = openNoteIndex + fret

  if (noteIndex < 0 || noteIndex >= NOTES.length) {
    return { note: 'Unknown', octave: 0 }
  }

  const noteStr = NOTES[noteIndex]
  const [note, octaveStr] = noteStr.match(/([A-G]#?)(\d)/)!.slice(1)
  return { note, octave: parseInt(octaveStr, 10) }
}
