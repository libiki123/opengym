import { describe, expect, it } from 'vitest'
import { validBackup } from './backup.js'

describe('backup validation', () => {
  it('accepts correctly shaped workout and routine collections', () => {
    expect(validBackup({ workouts: [{ d: '2026-10-14', entries: [{ id: 'e', sets: [{ done: true }] }] }], routines: [{ id: 'r', name: 'Plan', ex: [{ id: 'e' }] }] })).toBe(true)
  })

  it.each([
    { workouts: {}, routines: [] },
    { workouts: [null], routines: [] },
    { workouts: [{ d: 'today', entries: [{ id: 'e', sets: [null] }] }], routines: [] },
    { workouts: [{ d: 'today', entries: [{ id: 'e', sets: [{}] }] }], routines: [] },
    { workouts: [], routines: [{ id: 'r', name: 'Plan', ex: [null] }] },
    { workouts: [], routines: [], bodyweight: null },
    { workouts: [], routines: [], customEx: {} },
    { workouts: [], routines: [], week: null },
    { workouts: [], routines: [], dayPlan: null },
    { workouts: [], routines: [], exWeights: null },
    { workouts: [], routines: [], active: { id: 'a', name: 'Session', entries: [] } },
  ])('rejects malformed nested data without accepting it', backup => expect(validBackup(backup)).toBe(false))
})
