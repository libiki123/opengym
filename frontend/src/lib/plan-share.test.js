import { describe, it, expect } from 'vitest'
import { buildPlanBundle, parsePlan, mergePlan } from './plan-share.js'

describe('custom exercise plan sharing', () => {
  it('restores custom exercise metadata when a plan is imported', () => {
    const source = {
      customEx: [{ id: 'cx1', n: 'my lift', bp: 'back', tg: '', eq: 'custom', custom: true }],
      routines: [{ id: 'r1', name: 'A', ex: [{ id: 'cx1', sets: 3, reps: 8 }] }],
      week: {}
    }
    const parsed = parsePlan(buildPlanBundle(source))
    const target = { routines: [], customEx: [] }
    mergePlan(target, parsed)
    expect(target.customEx[0]).toMatchObject({ tg: '', eq: 'custom', custom: true })
    expect(target.routines[0].ex[0].id).toBe(target.customEx[0].id)
  })
})
