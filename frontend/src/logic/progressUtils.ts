import { Spot } from '../types'

export function getSpot(spots: Spot[], string: number, fret: number): Spot | undefined {
  return spots.find(spot => spot.string === string && spot.fret === fret)
}