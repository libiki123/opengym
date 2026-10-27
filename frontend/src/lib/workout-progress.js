import { supersetUnits, unitOf } from './history.js'

export const exerciseDone = entry => !!entry?.sets.length && entry.sets.every(set => set.done)
export const workoutDone = active => !!active?.entries.length && active.entries.every(exerciseDone)

export function nextUnfinished(entries, after) {
  const partner = unitOf(supersetUnits(entries), after).find(idx => idx !== after && !exerciseDone(entries[idx]))
  if (partner !== undefined) return partner
  for (let offset = 1; offset <= entries.length; offset++) {
    const idx = (after + offset + entries.length) % entries.length
    if (!exerciseDone(entries[idx])) return idx
  }
  return -1
}

export function restAfterSet(entries, idx) {
  const unit = unitOf(supersetUnits(entries), idx)
  if (unit.every(i => exerciseDone(entries[i]))) return 'stop'
  const round = entries[idx].sets.filter(set => set.done).length
  // A shorter partner is finished once its own sets run out, regardless of exercise order.
  return round > 0 && unit.every(i => entries[i].sets.filter(set => set.done).length >= Math.min(round, entries[i].sets.length)) ? 'start' : 'none'
}
