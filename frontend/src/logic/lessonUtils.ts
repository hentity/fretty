import { Spot, Progress } from '../types'

export const MAX_DAILY_NOTES = 5

function getSpotsByStatus(spots: Spot[], status: string): Spot[] {
  return spots.filter((spot) => spot.status === status)
}

export function buildLesson(progress: Progress): Spot[] {
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
    spot.status = 'learning'
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
  
  if (spot.status === 'learning') {
    if (result === 'fail') {
      spot.good_attempts = 0
      console.log('Fail → Reset good_attempts to 0')
    } else if (result == 'hard') {
      console.log('Hard → good_attempts stays the same')
    } else if (result === 'good') {
      spot.good_attempts += 1
      console.log('👍 Good → Increment good_attempts')
    } else if (result === 'easy') {
      spot.good_attempts = LEARNING_GOOD_ATTEMPTS
      console.log('✨ Easy → Jump to full good_attempts')
    }
  }

  if (spot.good_attempts >= LEARNING_GOOD_ATTEMPTS) {
    if (spot.all_attempts > LEARNING_GOOD_ATTEMPTS + 1) {
      spot.ease_factor = Math.min(spot.ease_factor, BASE_EASE_FACTOR)
      spot.interval = Math.max(1, spot.interval / spot.ease_factor)
      console.log('More than one fail → Ease factor reset, interval reduced')
    } else if (spot.all_attempts > LEARNING_GOOD_ATTEMPTS) {
      spot.ease_factor = Math.max(MIN_EASE_FACTOR, spot.ease_factor - EASE_FACTOR_DROP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('One fail → Decreased ease, increased interval')
    } else if (spot.all_attempts == LEARNING_GOOD_ATTEMPTS) {
      spot.interval = spot.interval * spot.ease_factor
      console.log('No fails → Same ease, increased interval')
    } else if (result === 'easy') {
      spot.ease_factor = Math.min(MAX_EASE_FACTOR, spot.ease_factor + EASE_FACTOR_BUMP)
      spot.interval = spot.interval * spot.ease_factor
      console.log('Easy → Increased ease, increased interval')
    }
    
    spot.status = 'review'
    spot.good_attempts = 0
    spot.all_attempts = 0
  }

  console.log(`✅ After: status=${spot.status}, ease=${spot.ease_factor.toFixed(2)} interval=${spot.interval.toFixed(2)} good_attempts=${spot.good_attempts}, all_attempts=${spot.all_attempts}`)
  return spot
}
