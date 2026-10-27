import { describe, expect, it } from 'vitest'
import { exerciseDone, workoutDone, nextUnfinished, restAfterSet } from './workout-progress.js'

const entry = (...done) => ({ sets: done.map(done => ({ done })) })

describe('workout progress', () => {
  it('requires every exercise and every set before completing', () => {
    expect(workoutDone({ entries: [entry(false), entry(true)] })).toBe(false)
    expect(workoutDone({ entries: [entry(true), entry(true)] })).toBe(true)
    expect(workoutDone({ entries: [] })).toBe(false)
    expect(workoutDone(null)).toBe(false)
    expect(workoutDone({ entries: [entry()] })).toBe(false)
    expect(exerciseDone(entry(true, false))).toBe(false)
  })

  it('finds the next unfinished exercise and wraps from the last to earlier work', () => {
    const entries = [entry(false), entry(true), entry(false), entry(true)]
    expect(nextUnfinished(entries, 0)).toBe(2)
    expect(nextUnfinished(entries, 3)).toBe(0)
    expect(nextUnfinished(entries, 2)).toBe(0)
    expect(nextUnfinished([entry(true)], 0)).toBe(-1)
    expect(nextUnfinished([], 0)).toBe(-1)
  })

  it('keeps an unfinished superset partner next and rests after both finish a round', () => {
    const entries = [{ ...entry(true, false), sg: 'a' }, { ...entry(false, false), sg: 'a' }, entry(true, false)]
    expect(nextUnfinished(entries, 0)).toBe(1)
    expect(restAfterSet(entries, 0)).toBe('none')
    entries[1].sets[0].done = true
    expect(restAfterSet(entries, 1)).toBe('start')
    entries[0].sets[1].done = true
    expect(restAfterSet(entries, 0)).toBe('none')
    entries[1].sets[1].done = true
    expect(restAfterSet(entries, 1)).toBe('stop')
    expect(restAfterSet(entries, 2)).toBe('start')
    entries[0].sets[0].done = false
    expect(nextUnfinished(entries, 1)).toBe(0)
  })

  it('does not rest when the later superset member is completed before its partner', () => {
    const entries = [{ ...entry(false, false), sg: 'a' }, { ...entry(true, false), sg: 'a' }]
    expect(restAfterSet(entries, 1)).toBe('none')
    entries[0].sets[0].done = true
    expect(restAfterSet(entries, 0)).toBe('start')
    entries[1].sets[1].done = true
    expect(restAfterSet(entries, 1)).toBe('none')
    entries[0].sets[1].done = true
    expect(restAfterSet(entries, 0)).toBe('stop')
  })

  it('supports unequal superset set counts without waiting for nonexistent partner sets', () => {
    const entries = [{ ...entry(true, false, false), sg: 'a' }, { ...entry(true), sg: 'a' }]
    expect(restAfterSet(entries, 1)).toBe('start')
    entries[0].sets[1].done = true
    expect(restAfterSet(entries, 0)).toBe('start')
    entries[0].sets[2].done = true
    expect(restAfterSet(entries, 0)).toBe('stop')
    const reverse = [{ ...entry(true), sg: 'a' }, { ...entry(true, true, false), sg: 'a' }]
    expect(restAfterSet(reverse, 1)).toBe('start')
    reverse[1].sets[2].done = true
    expect(restAfterSet(reverse, 1)).toBe('stop')
  })

  it('reopens completion when a set is added or unchecked', () => {
    const active = { entries: [entry(true), entry(true)] }
    active.entries[1].sets.push({ done: false })
    expect(workoutDone(active)).toBe(false)
    expect(nextUnfinished(active.entries, 0)).toBe(1)
    active.entries[1].sets.pop()
    active.entries[0].sets[0].done = false
    expect(workoutDone(active)).toBe(false)
    expect(nextUnfinished(active.entries, 1)).toBe(0)
  })
})
