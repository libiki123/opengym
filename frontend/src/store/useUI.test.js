import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('cancels a timed-set completion when the workout is abandoned', async () => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.doMock('../lib/format.js', () => ({ uid: () => 'id' }))
  vi.doMock('../lib/sound.js', () => ({ beep: vi.fn(), vibrate: vi.fn() }))
  vi.doMock('../lib/api.js', () => ({ api: vi.fn() }))
  vi.doMock('../lib/i18n.js', () => ({ t: x => x }))
  vi.doMock('./useStore.js', () => ({ useStore: { getState: () => ({ user: null, S: { sound: false } }) } }))
  const { useUI } = await import('./useUI.js')
  const done = vi.fn()

  useUI.getState().startWork(1, 'Plank', done)
  useUI.getState().stopWork()
  await vi.advanceTimersByTimeAsync(1500)

  expect(useUI.getState().work).toBeNull()
  expect(done).not.toHaveBeenCalled()
})
