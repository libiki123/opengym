export function createSheetTouchHandlers(ref, drag, sheet, closeSheet) {
  const onTouchStart = e => {
    if (e.target.closest && e.target.closest('.chips, input[type=range], [data-nodrag]')) {
      drag.current = { startY: null, startX: null, delta: 0, axis: null }
      return
    }
    const point = e.touches ? e.touches[0] : e
    drag.current = { startY: ref.current.scrollTop <= 0 ? point.clientY : null, startX: point.clientX, delta: 0, axis: null }
  }
  const onTouchMove = e => {
    const el = ref.current, d = drag.current
    if (d.startY === null) return
    const point = e.touches ? e.touches[0] : e
    const dx = point.clientX - d.startX
    d.delta = point.clientY - d.startY
    if (!d.axis && Math.max(Math.abs(dx), Math.abs(d.delta)) > 8) d.axis = Math.abs(dx) > Math.abs(d.delta) ? 'x' : 'y'
    if (d.axis === 'y' && d.delta > 0 && el.scrollTop <= 0) {
      e.preventDefault()
      el.style.transition = 'none'
      el.style.transform = `translateY(${d.delta}px)`
    } else d.delta = 0
  }
  const onTouchEnd = () => {
    const el = ref.current, d = drag.current
    if (d.startY === null) return
    el.style.transition = 'transform .2s'
    if (d.delta > 90 && !sheet.locked) { el.style.transform = 'translateY(110%)'; setTimeout(() => closeSheet(sheet.id), 180) }
    else el.style.transform = ''
    d.startY = d.startX = null
    d.axis = null
  }
  const onTouchCancel = () => {
    drag.current.startY = drag.current.startX = null
    drag.current.delta = 0
    drag.current.axis = null
    if (ref.current) {
      ref.current.style.transition = 'transform .2s'
      ref.current.style.transform = ''
    }
  }
  const onPointerDown = e => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('button, input, select, textarea, a, [contenteditable]')) return
    onTouchStart(e)
  }
  const onPointerMove = e => {
    if (e.pointerType !== 'mouse') return
    if (e.buttons === 0) { onTouchCancel(); return }
    onTouchMove(e)
    if (drag.current.axis === 'y' && drag.current.delta > 0) e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerUp = e => { if (e.pointerType === 'mouse') onTouchEnd() }
  const onPointerCancel = e => { if (e.pointerType === 'mouse') onTouchCancel() }
  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
