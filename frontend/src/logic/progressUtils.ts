import { Spot, Progress } from '../types'
import { spotToNote } from '../logic/noteUtils'

export function getSpot(spots: Spot[], string: number, fret: number): Spot | undefined {
  return spots.find(spot => spot.string === string && spot.fret === fret)
}

export function createDefaultProgress(customTuning?: string[]): Progress {
  const tuning = customTuning ?? ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']

  const spots: Spot[] = []
  for (let string = 0; string < 6; string++) {
    for (let fret = 1; fret <= 12; fret++) {
      const { note, octave } = spotToNote(string, fret, tuning)
      let status: Spot['status'] = "unseen"
      if (note.length > 1) { status = "unlearnable" }
      spots.push({
        status: status,
        interval: 1,
        ease_factor: 1.6,
        good_attempts: 0,
        all_attempts: 0,
        string,
        fret,
        note,
        octave,
        num_practices: 0,
        is_new: true
      })
    }
  }

  return {
    new: true,
    tuning,
    recentSpots: null,
    last_review_date: null,
    review_date_to_spots: {},
    spot_to_review_date: {},
    spots
  }
}