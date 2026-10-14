import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it, vi } from 'vitest'
import { createSheetTouchHandlers } from './sheet-touch.js'

it('caches only exercise dataset CDN media and never API responses', async () => {
  const listeners = {}
  const put = vi.fn(() => Promise.reject(new Error('quota exceeded')))
  const cache = { match: vi.fn(() => Promise.resolve(null)), put }
  const self = { addEventListener: (name, fn) => { listeners[name] = fn } }
  const fetchMock = vi.fn(async () => ({ ok: false, type: 'opaque', clone() { return this } }))
  runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
    self, location: { origin: 'https://opengym.test' }, URL,
    caches: { open: vi.fn(async () => cache) }, fetch: fetchMock
  })

  const request = url => {
    const event = { request: { url, method: 'GET' }, respondWith: vi.fn() }
    listeners.fetch(event)
    return event
  }
  const cdn = request('https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@abc123/images/a.jpg')
  expect(cdn.respondWith).toHaveBeenCalledOnce()
  await expect(cdn.respondWith.mock.calls[0][0]).resolves.toMatchObject({ type: 'opaque' })
  expect(put).toHaveBeenCalledOnce()
  expect(request('https://other.example/img/a.jpg').respondWith).not.toHaveBeenCalled()
  expect(request('https://opengym.test/api/account').respondWith).not.toHaveBeenCalled()
})

it('locks sheet drags to vertical movement and resets on cancellation', () => {
  const ref = { current: { scrollTop: 0, style: {} } }
  const drag = { current: {} }
  const handlers = createSheetTouchHandlers(ref, drag, { id: 'sheet', locked: false }, vi.fn())
  const touch = (x, y, target = { closest: () => null }) => ({ target, touches: [{ clientX: x, clientY: y }], preventDefault: vi.fn() })

  handlers.onTouchStart(touch(0, 0))
  const diagonal = touch(80, 3)
  handlers.onTouchMove(diagonal)
  expect(diagonal.preventDefault).not.toHaveBeenCalled()
  expect(ref.current.style.transform).toBeUndefined()

  handlers.onTouchStart(touch(0, 0))
  const downward = touch(3, 100)
  handlers.onTouchMove(downward)
  expect(downward.preventDefault).toHaveBeenCalledOnce()
  expect(ref.current.style.transform).toBe('translateY(100px)')
  handlers.onTouchCancel()
  expect(ref.current.style.transform).toBe('')

  handlers.onTouchStart(touch(0, 0, { closest: selector => selector.includes('.chips') ? {} : null }))
  const chipsSwipe = touch(0, 100)
  handlers.onTouchMove(chipsSwipe)
  expect(chipsSwipe.preventDefault).not.toHaveBeenCalled()
})
