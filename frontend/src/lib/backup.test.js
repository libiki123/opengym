import { describe, expect, it } from 'vitest'
import { validBackup } from './backup.js'

describe('backup validation', () => {
  it('accepts correctly shaped workout and routine collections', () => {
    expect(validBackup({ workouts: [{ d: '2026-10-14', entries: [{ id: 'e', sets: [{ done: true }] }] }], routines: [{ id: 'r', name: 'Plan', ex: [{ id: 'e' }] }] })).toBe(true)
  })

  it.each([0, -1, 1.5, 3601, Infinity, '180', null])('rejects invalid exercise rest seconds: %j', restSec => {
    expect(validBackup({ workouts: [], routines: [{ id: 'r', name: 'Plan', ex: [{ id: 'e', restSec }] }] })).toBe(false)
  })

  it('preserves a valid per-exercise timer in a backup', () => {
    expect(validBackup({ workouts: [], routines: [{ id: 'r', name: 'Plan', ex: [{ id: 'e', restSec: 180 }] }] })).toBe(true)
  })

  it('round-trips body fat history and accepts older backups without it', () => {
    const legacy = { workouts: [], routines: [], bodyweight: [{ d: '2026-10-26', w: 70 }] }
    expect(validBackup(legacy)).toBe(true)
    const backup = { ...legacy, bodyfat: [{ d: '2026-10-26', pct: 18.5, t: 123 }] }
    const restored = JSON.parse(JSON.stringify(backup))
    expect(validBackup(restored)).toBe(true)
    expect(restored).toEqual(backup)
  })

  it.each([null, {}, [null], [{ d: 12, pct: 18 }], ...[null, '18', NaN, Infinity, -1, 0, 100, 101].map(pct => [{ d: '2026-10-26', pct }])])('rejects malformed body fat history: %j', bodyfat => {
    expect(validBackup({ workouts: [], routines: [], bodyfat })).toBe(false)
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
