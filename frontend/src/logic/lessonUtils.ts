import { Spot, Progress } from '../types'
import { spotToNote } from './noteUtils'

export const MAX_DAILY_NOTES   = 6        // lesson size
export const RANDOM_POP_LEN    = 2
export const MASTERED_THRESHOLD = 14

export const todayISO = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('sv-SE')
}

export const spotKey = (s: Spot): string => `${s.string}-${s.fret}`

export const getSpotsByKeys = (spots: Spot[], keys: string[]) =>
  spots.filter((s) => keys.includes(spotKey(s)))

export const getSpot = (spots: Spot[], string: number, fret: number) => {
  const matching = spots.filter((s) => s.string == string && s.fret == fret)
  if (matching.length == 1) return matching[0]
  return null
}

export const getMasteryPct = (spot: Spot) =>
  Math.min((Math.log(spot.interval + 0.2) / Math.log(MASTERED_THRESHOLD + 0.2)) * 100, 100)

export const removeReview = (progress: Progress, spot: Spot) => {
  const key = spotKey(spot)
  const date = progress.spot_to_review_date[key]
  if (!date) return
  // remove from date list
  progress.review_date_to_spots[date] =
    progress.review_date_to_spots[date].filter((k) => k !== key)
  if (!progress.review_date_to_spots[date].length)
    delete progress.review_date_to_spots[date]
  // remove reverse map
  delete progress.spot_to_review_date[key]
}

export const scheduleReview = (
  progress: Progress,
  spot: Spot,
  days: number,
  startDateISO: string
) => {
  const key = spotKey(spot)
  // remove any previous schedule first
  removeReview(progress, spot)

  const target = new Date(startDateISO)
  target.setDate(target.getDate() + days)

  // bump forward until capacity for that day
  while (true) {
    const iso = target.toISOString().slice(0, 10)
    const bucket = progress.review_date_to_spots[iso] ?? []
    if (bucket.length < MAX_DAILY_NOTES) {
      // store
      progress.review_date_to_spots[iso] = [...bucket, key]
      progress.spot_to_review_date[key] = iso
      break
    }
    target.setDate(target.getDate() + 1)
  }
}

export const buildLesson = (
  progress: Progress,
  today = todayISO()
): Spot[] => {
  const lesson: Spot[] = [];

  const addSpots = (spots: Spot[]) => {
    const remaining = MAX_DAILY_NOTES - lesson.length;
    if (remaining > 0) lesson.push(...spots.slice(0, remaining));
  };

  // add spots due for review
  const keysToday = progress.review_date_to_spots[today] ?? [];
  const dueReviews = getSpotsByKeys(progress.spots, keysToday);
  addSpots(dueReviews);

  // add other unlearned/unseen spots
  const learning = progress.spots.filter((s) => s.status === 'learning');
  addSpots(learning);

  const unseen = progress.spots.filter((s) => s.status === 'unseen');
  addSpots(unseen);

  // set status and attempt counts
  lesson.forEach((s) => {
    s.status = 'learning';
    s.good_attempts = 0;
    s.all_attempts = 0;
  });

  // shuffle lesson
  for (let i = lesson.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lesson[i], lesson[j]] = [lesson[j], lesson[i]];
  }

  return lesson;
};

export const buildTutorial = (
  progress: Progress,
): Spot[] => {

  // specify tutorial as (note, string) pairs
  const targetPairs: [string, number][] = [
    ['G', 0],
    ['B', 1],
    ['D', 1],
    ['G', 2],
    ['A', 4],
    ['D', 5],
  ];

  const spots: Spot[] = [];

  for (const [targetNote, string] of targetPairs) {
    for (let fret = 1; fret <= 12; fret++) {
      const { note } = spotToNote(string, fret, progress.tuning);
      if (note === targetNote) {
        const match = progress.spots.find((s) => s.string === string && s.fret === fret);
        if (match) {
          spots.push(match);
        }
        break; // Stop at first match
      }
    }
  }

  // Set progress fields
  spots.forEach((s) => {
    s.good_attempts = 0;
    s.all_attempts = 0;
  });

  return spots;
};

export const previewLesson = (
  progress: Progress,
  today = todayISO()
): Spot[] => {
  const lesson: Spot[] = []

  const addSpots = (spots: Spot[]) => {
    const remaining = MAX_DAILY_NOTES - lesson.length
    if (remaining > 0) lesson.push(...spots.slice(0, remaining))
  }

  // add spots due for review
  const keysToday   = progress.review_date_to_spots[today] ?? []
  const dueReviews  = getSpotsByKeys(progress.spots, keysToday)
  addSpots(dueReviews)

  // add other unlearned/unseen spots
  const learning    = progress.spots.filter((s) => s.status === 'learning')
  addSpots(learning)

  const unseen      = progress.spots.filter((s) => s.status === 'unseen')
  addSpots(unseen)

  return lesson
}

/**
 * pick the next spot from the lesson queue.
 * wherever possible choose one whose first note-letter differs from `currentNote`
 * to avoid repeating the same note back-to-back.
 */
export function getNextRandomSpot(
  lesson: Spot[],
  currentNote?: string | null,
): [Spot, Spot[]] {
  const copy = [...lesson];
  const maxIndex = Math.min(RANDOM_POP_LEN, copy.length);

  // quick exit for the original behaviour
  if (currentNote == null) {
    const index = Math.floor(Math.random() * maxIndex);
    const [nextSpot] = copy.splice(index, 1);
    return [nextSpot, copy];
  }

  // --- preferential selection ------------------------------------------
  const primaryChoices: number[] = [];
  for (let i = 0; i < maxIndex; i++) {
    if (copy[i].note[0] !== currentNote) primaryChoices.push(i);
  }

  // fall back to original pool if no suitable alternative found
  const pool =
    primaryChoices.length > 0
      ? primaryChoices
      : Array.from({ length: maxIndex }, (_, i) => i);

  const index = pool[Math.floor(Math.random() * pool.length)];
  const [nextSpot] = copy.splice(index, 1);
  return [nextSpot, copy];
}


export const LEARNING_GOOD_ATTEMPTS = 3

export function addAttempt(spot: Spot, result: 'easy' | 'good' | 'hard' | 'fail' | null, isPractice = false) {
  if (spot.status === 'unlearnable') return spot

  spot.all_attempts += 1
  spot.num_practices += 1

  if (spot.status === 'learning' || spot.status === 'review') {
    if (result === 'fail') {
      spot.good_attempts = 0
    } else if (result === 'hard') {
      // no change to good_attempts
    } else if (result === 'good') {
      spot.good_attempts += 1
    } else if (result === 'easy') {
      spot.good_attempts = Math.min(spot.good_attempts + 2, LEARNING_GOOD_ATTEMPTS)
    }
  }

  if (spot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
    const prevInterval = spot.interval
    if (spot.is_new) {
      spot.interval = spot.all_attempts <= LEARNING_GOOD_ATTEMPTS ? 2 : 1
      spot.is_new = false
      if (isPractice) {
        console.log(`[note practiced] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts`)
      } else {
        console.log(`[note learned] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts → interval set to ${spot.interval}d`)
      }
    } else {
      if (spot.all_attempts > 8) {
        spot.interval = 1
        if (isPractice) {
          console.log(`[note practiced] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts`)
        } else {
          console.log(`[note reviewed] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts → interval reset to 1d`)
        }
      } else {
        let ease: number
        if (spot.all_attempts <= 3)       ease = 2.0
        else if (spot.all_attempts === 4) ease = 1.6
        else if (spot.all_attempts === 5) ease = 1.0
        else                              ease = 0.5  // 6–8
        spot.interval = Math.max(1, spot.interval * ease)
        if (isPractice) {
          console.log(`[note practiced] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts`)
        } else {
          console.log(`[note reviewed] ${spot.note} (string ${spot.string}, fret ${spot.fret}) — ${spot.all_attempts} attempts, ease ${ease}x → interval ${prevInterval.toFixed(1)}d → ${spot.interval.toFixed(1)}d`)
        }
      }
    }
    spot.status = 'review'
  }

  return spot
}

export function pushBackReviews(progress: Progress, todayISO: string) {
  const dateKeys = Object.keys(progress.review_date_to_spots)
  if (dateKeys.length === 0) return

  const sortedDates = dateKeys.sort() // ascending YYYY-MM-DD
  const earliestDate = sortedDates[0]

  if (earliestDate >= todayISO) {
    // already up to date
    return
  }

  const d = calculateDaysDifference(earliestDate, todayISO)

  // Step 1: shift all dates forward by d so the most overdue land on today
  const newReviewDateToSpots: Record<string, string[]> = {}
  const newSpotToReviewDate: Record<string, string> = {}

  for (const [oldDate, spots] of Object.entries(progress.review_date_to_spots)) {
    const newDate = shiftDate(oldDate, d)
    newReviewDateToSpots[newDate] = (newReviewDateToSpots[newDate] || []).concat(spots)
    for (const spotKey of spots) {
      newSpotToReviewDate[spotKey] = newDate
    }
  }

  progress.review_date_to_spots = newReviewDateToSpots
  progress.spot_to_review_date = newSpotToReviewDate

  // Step 2: undo — try to pull reviews back toward their original dates.
  // Process future dates soonest-first so earlier slots aren't claimed by later buckets.
  const futureDates = Object.keys(progress.review_date_to_spots)
    .filter(date => date > todayISO)
    .sort()

  for (const dateY of futureDates) {
    const spotsOnDay = [...(progress.review_date_to_spots[dateY] ?? [])]
    if (spotsOnDay.length === 0) continue

    let remaining = [...spotsOnDay]

    for (let offset = d; offset >= 1 && remaining.length > 0; offset--) {
      const rawTarget = shiftDate(dateY, -offset)
      // Cap at today — don't place anything in the past
      const targetDate = rawTarget < todayISO ? todayISO : rawTarget

      const currentBucket = progress.review_date_to_spots[targetDate] ?? []
      const capacity = MAX_DAILY_NOTES - currentBucket.length
      if (capacity <= 0) continue

      const toMove = remaining.splice(0, capacity)
      progress.review_date_to_spots[targetDate] = [...currentBucket, ...toMove]
      for (const key of toMove) {
        progress.spot_to_review_date[key] = targetDate
      }
    }

    // Update or remove the source bucket
    if (remaining.length === 0) {
      delete progress.review_date_to_spots[dateY]
    } else if (remaining.length < spotsOnDay.length) {
      progress.review_date_to_spots[dateY] = remaining
    }
  }
}

function calculateDaysDifference(fromISO: string, toISO: string): number {
  const from = new Date(fromISO)
  const to = new Date(toISO)
  const diffTime = to.getTime() - from.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) // ms to days
}

function shiftDate(dateISO: string, days: number): string {
  const date = new Date(dateISO)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

