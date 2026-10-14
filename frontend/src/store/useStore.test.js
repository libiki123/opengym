import { beforeEach, describe, expect, it, vi } from 'vitest'

let memory, storageListener, store

beforeEach(async () => {
  vi.resetModules()
  memory = new Map()
  storageListener = null
  vi.stubGlobal('localStorage', {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: key => memory.delete(key),
  })
  vi.stubGlobal('window', { addEventListener: (name, fn) => { if (name === 'storage') storageListener = fn } })
  vi.stubGlobal('document', { addEventListener: vi.fn(), visibilityState: 'visible' })
  vi.doMock('../lib/api.js', () => ({ api: vi.fn() }))
  vi.doMock('../lib/format.js', () => ({ localTZ: () => 'UTC' }))
  vi.doMock('../lib/exercises.js', () => ({ registerCustom: vi.fn() }))
  vi.doMock('../lib/demo.js', () => ({ DEMO: false, DEMO_SEEDED: 'seeded' }))
  vi.doMock('../lib/mobile.js', () => ({ MOBILE: false, nativeLoad: vi.fn(), nativeSave: vi.fn(), syncReminder: vi.fn() }))
  ;({ useStore: store } = await import('./useStore.js'))
})

describe('cross-tab state updates', () => {
  it('applies a mutation to the latest saved state instead of replacing concurrent changes', () => {
    memory.set('gym_state_v1', JSON.stringify({ workouts: [], routines: [], accent: 'blue' }))
    store.getState().update(s => { s.lang = 'fr' }, false)
    expect(JSON.parse(memory.get('gym_state_v1'))).toMatchObject({ accent: 'blue', lang: 'fr' })
  })

  it('hydrates storage events without writing back or scheduling a push', () => {
    const incoming = { workouts: [], routines: [], accent: 'red' }
    const setItem = vi.spyOn(localStorage, 'setItem')
    storageListener({ key: 'gym_state_v1', newValue: JSON.stringify(incoming) })
    expect(store.getState().S.accent).toBe('red')
    expect(setItem).not.toHaveBeenCalled()
  })
})
