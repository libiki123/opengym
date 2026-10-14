export function createSheetTouchHandlers(ref, drag, sheet, closeSheet) {
  const onTouchStart = e => {
    if (e.target.closest && e.target.closest('.chips, input[type=range], [data-nodrag]')) {
      drag.current = { startY: null, startX: null, delta: 0, axis: null }
      return
    }
    drag.current = { startY: ref.current.scrollTop <= 0 ? e.touches[0].clientY : null, startX: e.touches[0].clientX, delta: 0, axis: null }
  }
  const onTouchMove = e => {
    const el = ref.current, d = drag.current
    if (d.startY === null) return
    const dx = e.touches[0].clientX - d.startX
    d.delta = e.touches[0].clientY - d.startY
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
  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel }
}
