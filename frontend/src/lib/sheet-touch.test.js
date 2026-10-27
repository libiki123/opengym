import { afterEach, expect, it, vi } from 'vitest'
import { createSheetTouchHandlers } from './sheet-touch.js'

afterEach(() => vi.useRealTimers())

function setup({ locked = false, scrollTop = 0 } = {}) {
  const el = { scrollTop, style: {}, setPointerCapture: vi.fn() }
  const close = vi.fn()
  const drag = { current: { startY: null, startX: null, delta: 0, axis: null } }
  const handlers = createSheetTouchHandlers({ current: el }, drag, { id: 'sheet', locked }, close)
  const pointer = (x, y, extra = {}) => ({
    pointerType: 'mouse', button: 0, buttons: 1, pointerId: 1, clientX: x, clientY: y,
    target: { closest: () => null }, currentTarget: el, preventDefault: vi.fn(), ...extra
  })
  return { el, close, handlers, pointer }
}

it('closes a sheet after a downward mouse drag, capturing the pointer outside the sheet', () => {
  vi.useFakeTimers()
  const { el, close, handlers, pointer } = setup()
  handlers.onPointerDown(pointer(50, 20))
  expect(el.setPointerCapture).not.toHaveBeenCalled()
  handlers.onPointerMove(pointer(52, 130))
  expect(el.setPointerCapture).toHaveBeenCalledWith(1)
  expect(el.style.transform).toBe('translateY(110px)')
  handlers.onPointerUp(pointer(52, 130))
  vi.runAllTimers()
  expect(close).toHaveBeenCalledWith('sheet')
})

it('preserves ordinary clicks on clickable sheet rows without capturing or preventing them', () => {
  const { el, handlers, pointer } = setup()
  const down = pointer(0, 0)
  handlers.onPointerDown(down)
  const jitter = pointer(2, 3)
  handlers.onPointerMove(jitter)
  handlers.onPointerUp(pointer(2, 3))
  expect(down.preventDefault).not.toHaveBeenCalled()
  expect(jitter.preventDefault).not.toHaveBeenCalled()
  expect(el.setPointerCapture).not.toHaveBeenCalled()
})

it('resets an uncaptured drag if the mouse was released outside the sheet', () => {
  vi.useFakeTimers()
  const { el, close, handlers, pointer } = setup()
  handlers.onPointerDown(pointer(0, 0))
  handlers.onPointerMove(pointer(0, 120, { buttons: 0 }))
  handlers.onPointerUp(pointer(0, 120, { buttons: 0 }))
  vi.runAllTimers()
  expect(el.setPointerCapture).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  expect(el.style.transform).toBe('')
})

it.each(['short', 'cancelled', 'locked', 'horizontal', 'scrolled'])('keeps the sheet open for a %s mouse drag', kind => {
  vi.useFakeTimers()
  const { el, close, handlers, pointer } = setup({ locked: kind === 'locked', scrollTop: kind === 'scrolled' ? 10 : 0 })
  handlers.onPointerDown(pointer(0, 0))
  handlers.onPointerMove(pointer(kind === 'horizontal' ? 200 : 0, kind === 'short' ? 50 : 120))
  if (kind === 'cancelled') handlers.onPointerCancel(pointer(0, 120))
  else handlers.onPointerUp(pointer(0, 120))
  vi.runAllTimers()
  expect(close).not.toHaveBeenCalled()
  expect(el.style.transform || '').toBe('')
})

it.each([
  { button: 2 },
  { pointerType: 'touch' },
  { target: { closest: selector => selector.includes('button') ? {} : null } },
  { target: { closest: selector => selector.includes('.chips') ? {} : null } }
])('leaves controls and non-primary mouse gestures alone: %j', extra => {
  vi.useFakeTimers()
  const { el, close, handlers, pointer } = setup()
  handlers.onPointerDown(pointer(0, 0, extra))
  handlers.onPointerMove(pointer(0, 120, extra))
  handlers.onPointerUp(pointer(0, 120, extra))
  vi.runAllTimers()
  expect(el.setPointerCapture).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
})
