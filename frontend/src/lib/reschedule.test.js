import { describe, expect, it } from 'vitest'
import { planMove, applyMove, undoMove } from './reschedule.js'

const today = '2026-10-26', from = '2026-10-28', rest = '2026-10-29', occupied = '2026-10-30'
const state = () => ({ routines: [{ id: 'upper' }, { id: 'lower' }], week: { 3: 'upper', 5: 'lower' }, dayPlan: {}, workouts: [], active: null, bodyfat: [{ d: today, pct: 20 }] })
const plan = (s, to = rest) => planMove(s, from, to, today)

describe('one-time workout rescheduling', () => {
  it('moves to rest atomically without changing weekly assignments or unrelated data', () => {
    const s = state(), before = structuredClone(s)
    const receipt = applyMove(s, plan(s), 'move', today)
    expect(receipt.error).toBeUndefined()
    expect(s.dayPlan).toEqual({ [from]: 'rest', [rest]: 'upper' })
    expect({ ...s, dayPlan: {} }).toEqual(before)
  })

  it.each(['swap', 'replace'])('resolves an occupied destination with explicit %s', mode => {
    const s = state()
    const receipt = applyMove(s, plan(s, occupied), mode, today)
    expect(receipt.error).toBeUndefined()
    expect(s.dayPlan).toEqual({ [from]: mode === 'swap' ? 'lower' : 'rest', [occupied]: 'upper' })
    expect(s.week).toEqual({ 3: 'upper', 5: 'lower' })
  })

  it('requires a conflict choice and leaves both dates unchanged otherwise', () => {
    const s = state(), before = structuredClone(s)
    expect(applyMove(s, plan(s, occupied), 'move', today).error).toBeTruthy()
    expect(s).toEqual(before)
  })

  it.each(['2026-02-30', 'not-a-date', '', '2026-10-25', from])('rejects an invalid/same/past target %s without mutation', to => {
    const s = state(), before = structuredClone(s)
    expect(planMove(s, from, to, today).error).toBeTruthy()
    expect(s).toEqual(before)
  })

  it('does not change anything while previewing or cancelling a move', () => {
    const s = state(), before = structuredClone(s)
    expect(plan(s).error).toBeUndefined()
    expect(s).toEqual(before)
  })

  it.each(['source', 'target'])('rejects a stale %s schedule before committing', which => {
    const s = state(), p = plan(s)
    s.dayPlan[which === 'source' ? from : rest] = 'lower'
    const before = structuredClone(s)
    expect(applyMove(s, p, 'move', today).error).toMatch(/schedule changed/)
    expect(s).toEqual(before)
  })

  it('rejects a deleted source routine', () => {
    const s = state(), p = plan(s)
    s.routines = s.routines.filter(r => r.id !== 'upper')
    expect(applyMove(s, p, 'move', today).error).toMatch(/no workout/)
    expect(s.dayPlan).toEqual({})
  })

  it.each(['completed-source', 'active-source', 'completed-target', 'active-target'])('protects a %s session', kind => {
    const s = state(), p = plan(s)
    const d = kind.endsWith('source') ? from : rest
    if (kind.startsWith('active')) s.active = { d }
    else s.workouts.push({ d })
    expect(applyMove(s, p, 'move', today).error).toMatch(/started or completed/)
    expect(s.dayPlan).toEqual({})
  })

  it('rejects a same-routine swap but allows explicitly clearing the original date', () => {
    const s = state()
    s.dayPlan[occupied] = 'upper'
    expect(applyMove(s, plan(s, occupied), 'swap', today).error).toMatch(/same workout/)
    expect(s.dayPlan).toEqual({ [occupied]: 'upper' })
    expect(applyMove(s, plan(s, occupied), 'replace', today).error).toBeUndefined()
    expect(s.dayPlan[from]).toBe('rest')
  })

  it.each([{}, { [from]: 'lower', [rest]: 'rest', '2026-11-01': 'upper' }])('Undo restores exact overrides and inheritance: %j', overrides => {
    const s = state(); s.dayPlan = { ...overrides }
    const before = structuredClone(s)
    const receipt = applyMove(s, plan(s), 'move', today)
    expect(undoMove(s, receipt)).toEqual({})
    expect(s).toEqual(before)
  })

  it.each(['source', 'target', 'weekly', 'active', 'completed'])('Undo refuses to overwrite a later %s change', kind => {
    const s = state(), receipt = applyMove(s, plan(s), 'move', today)
    if (kind === 'source') s.dayPlan[from] = 'lower'
    if (kind === 'target') s.dayPlan[rest] = 'rest'
    if (kind === 'weekly') s.week[3] = 'lower'
    if (kind === 'active') s.active = { d: rest }
    if (kind === 'completed') s.workouts.push({ d: from })
    const before = structuredClone(s)
    expect(undoMove(s, receipt).error).toBeTruthy()
    expect(s).toEqual(before)
  })
})
