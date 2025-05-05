import { Spot, Progress } from '../types'

export const MAX_DAILY_NOTES   = 5        // lesson size
export const RANDOM_POP_LEN    = 2

export const todayISO = (offsetDays = 0): string => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toLocaleDateString('sv-SE')
}

export const spotKey = (s: Spot): string => `${s.string}-${s.fret}`

export const getSpotsByKeys = (spots: Spot[], keys: string[]) =>
  spots.filter((s) => keys.includes(spotKey(s)))

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

  console.log(progress)
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
  const tutorial: Spot[] = [];

  const tutorialSpot = (s: Spot): boolean => {
    if (s.string == 0 && s.fret == 3) return true;
    if (s.string == 2 && s.fret == 7) return true;
    if (s.string == 4 && s.fret == 10) return true;
    if (s.string == 2 && s.fret == 12) return true;
    if (s.string == 3 && s.fret == 2) return true;
    if (s.string == 5 && s.fret == 7) return true;
    if (s.string == 0 && s.fret == 10) return true;
    return false;
  }

  const spots = progress.spots.filter((s) => tutorialSpot(s));
  tutorial.push(...spots)

  // set status and attempt counts
  tutorial.forEach((s) => {
    s.status = 'learning';
    s.good_attempts = 0;
    s.all_attempts = 0;
  });

  return tutorial;
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
const BASE_EASE_FACTOR = 1.6
const MAX_EASE_FACTOR = 3.0
const MIN_EASE_FACTOR = 1.2
const EASE_FACTOR_DROP = 0.2
const EASE_FACTOR_BUMP = 0.2

export function addAttempt(spot: Spot, result: 'easy' | 'good' | 'hard' | 'fail') {
  if (spot.status === 'unlearnable') {
    console.log(`[SKIP] Spot at string ${spot.string}, fret ${spot.fret} is unlearnable.`)
    return spot
  }

  console.log(`\n📍 Spot at string ${spot.string}, fret ${spot.fret} — Starting status: ${spot.status}`)
  console.log(`⏱️ Result: ${result}`)
  console.log(`🎯 Before: ease=${spot.ease_factor.toFixed(2)} interval=${spot.interval.toFixed(2)} good_attempts=${spot.good_attempts}`)

  spot.all_attempts += 1
  spot.is_new = false
  
  if (spot.status === 'learning' || spot.status === 'review') {
    if (result === 'fail') {
      spot.good_attempts = 0
      console.log('Fail -> Reset good_attempts to 0')
    } else if (result == 'hard') {
      console.log('Hard -> good_attempts stays the same')
    } else if (result === 'good') {
      spot.good_attempts += 1
      console.log('👍 Good -> Increment good_attempts')
    } else if (result === 'easy') {
      spot.good_attempts = LEARNING_GOOD_ATTEMPTS
      console.log('✨ Easy -> Jump to full good_attempts')
    }
  }

  if (spot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
    if (spot.all_attempts > LEARNING_GOOD_ATTEMPTS + 1) {
      spot.ease_factor = Math.min(spot.ease_factor, BASE_EASE_FACTOR)
      spot.interval = Math.max(1, spot.interval / spot.ease_factor)
      console.log('More than one fail -> Ease factor reset, interval reduced')
    } else if (spot.all_attempts > LEARNING_GOOD_ATTEMPTS) {
      spot.ease_factor = Math.max(MIN_EASE_FACTOR, spot.ease_factor - EASE_FACTOR_DROP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('One fail -> Decreased ease, increased interval')
    } else if (spot.all_attempts == LEARNING_GOOD_ATTEMPTS) {
      spot.interval = spot.interval * spot.ease_factor
      console.log('No fails -> Same ease, increased interval')
    } else if (result === 'easy') {
      spot.ease_factor = Math.min(MAX_EASE_FACTOR, spot.ease_factor + EASE_FACTOR_BUMP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('Easy -> Increased ease, increased interval')
    }
    
    spot.status = 'review'
    spot.num_practices += 1
  }

  console.log(`✅ After: status=${spot.status}, ease=${spot.ease_factor.toFixed(2)} interval=${spot.interval.toFixed(2)} good_attempts=${spot.good_attempts}, all_attempts=${spot.all_attempts}`)
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

  const shiftDays = calculateDaysDifference(earliestDate, todayISO)

  const newReviewDateToSpots: Record<string, string[]> = {}
  const newSpotToReviewDate: Record<string, string> = {}

  for (const [oldDate, spots] of Object.entries(progress.review_date_to_spots)) {
    const newDate = shiftDate(oldDate, shiftDays)
    newReviewDateToSpots[newDate] = (newReviewDateToSpots[newDate] || []).concat(spots)
    for (const spotKey of spots) {
      newSpotToReviewDate[spotKey] = newDate
    }
  }

  progress.review_date_to_spots = newReviewDateToSpots
  progress.spot_to_review_date = newSpotToReviewDate
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
