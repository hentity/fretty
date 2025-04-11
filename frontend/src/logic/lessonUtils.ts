import { Spot, Progress } from '../types'

export const MAX_DAILY_NOTES = 5

function getSpotsByStatus(spots: Spot[], status: string): Spot[] {
  return spots.filter((spot) => spot.status === status)
}

export function createLesson(progress: Progress): Spot[] {
  const lesson: Spot[] = []

  const addSpots = (spots: Spot[]) => {
    const remaining = MAX_DAILY_NOTES - lesson.length
    lesson.push(...spots.slice(0, remaining))
  }

  const reviews = getSpotsByStatus(progress.spots, 'review')
  addSpots(reviews)

  const newSpots = getSpotsByStatus(progress.spots, 'learning')
  addSpots(newSpots)

  const unseen = getSpotsByStatus(progress.spots, 'unseen')
  addSpots(unseen)

  for (const spot of lesson) {
    if (spot.status === 'unseen') {
          spot.status = 'learning'
    }
  }

  return lesson
}

const RANDOM_POP_LEN = 2

export function getNextRandomSpot(lesson: Spot[]): [Spot, Spot[]] {
  const copy = [...lesson]
  const maxIndex = Math.min(RANDOM_POP_LEN, copy.length)
  const index = Math.floor(Math.random() * maxIndex)
  const [nextSpot] = copy.splice(index, 1)
  return [nextSpot, copy]
}

const LEARNING_GOOD_ATTEMPTS = 3
const BASE_EASE_FACTOR = 2.5
const MAX_EASE_FACTOR = 2.5
const MIN_EASE_FACTOR = 1.3
const EASE_FACTOR_DROP = 0.2
const EASE_FACTOR_BUMP = 0.15

export function addAttempt(spot: Spot, result: 'easy' | 'good' | 'hard' | 'fail') {
  if (spot.status === 'unlearnable') {
    console.log(`[SKIP] Spot at string ${spot.string}, fret ${spot.fret} is unlearnable.`)
    return spot
  }

  console.log(`\n📍 Spot at string ${spot.string}, fret ${spot.fret} — Starting status: ${spot.status}`)
  console.log(`⏱️ Result: ${result}`)
  console.log(`🎯 Before: ease=${spot.ease_factor.toFixed(2)} interval=${spot.interval.toFixed(2)} good_attempts=${spot.good_attempts}`)

  if (spot.status === 'learning') {
    if (result === 'fail') {
      spot.good_attempts = 0
      console.log('❌ Fail → Reset good_attempts to 0')
    } else if (result === 'good') {
      spot.good_attempts += 1
      console.log('👍 Good → Increment good_attempts')
    } else if (result === 'easy') {
      spot.good_attempts = LEARNING_GOOD_ATTEMPTS
      console.log('✨ Easy → Jump to full good_attempts')
    }

    if (spot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
      spot.status = 'review'
      spot.interval = Math.max(1, spot.interval)
      spot.good_attempts = 0
      console.log('✅ Promoted to REVIEW')
    }

  } else if (spot.status === 'review') {
    if (result === 'fail') {
      spot.status = 'learning'
      spot.good_attempts = LEARNING_GOOD_ATTEMPTS - 1
      spot.ease_factor = Math.min(spot.ease_factor, BASE_EASE_FACTOR)
      spot.interval = Math.max(1, spot.interval / spot.ease_factor)
      console.log('❌ Fail → Demoted to LEARNING, dropped ease factor')
    } else if (result === 'hard') {
      spot.ease_factor = Math.max(MIN_EASE_FACTOR, spot.ease_factor - EASE_FACTOR_DROP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('😬 Hard → Decreased ease, extended interval')
    } else if (result === 'good') {
      spot.interval = spot.interval * spot.ease_factor
      console.log('👍 Good → Increased interval (EF unchanged)')
    } else if (result === 'easy') {
      spot.ease_factor = Math.min(MAX_EASE_FACTOR, spot.ease_factor + EASE_FACTOR_BUMP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('✨ Easy → Boosted ease factor and interval')
    }
  }

  console.log(`✅ After: status=${spot.status}, ease=${spot.ease_factor.toFixed(2)} interval=${spot.interval.toFixed(2)} good_attempts=${spot.good_attempts}`)
  return spot
}
