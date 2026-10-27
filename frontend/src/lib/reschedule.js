import { effectiveRoutineId } from './history.js'
import { todayISO } from './format.js'

const validDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d + 'T12:00:00Z')) && new Date(d + 'T12:00:00Z').toISOString().slice(0, 10) === d
const snapshot = (s, d) => ({ override: s.dayPlan[d], weekly: s.week[new Date(d + 'T12:00:00').getDay()], id: effectiveRoutineId(s, d) })
const same = (a, b) => a.override === b.override && a.weekly === b.weekly && a.id === b.id
const busy = (s, d) => s.workouts.some(w => w.d === d) || s.active?.d === d

export function planMove(s, from, to, today = todayISO()) {
  if (!validDate(from) || !validDate(to)) return { error: 'Choose a valid date.' }
  if (from === to) return { error: 'Choose a different date.' }
  if (to < today) return { error: 'Choose today or a future date.' }
  if (busy(s, from)) return { error: 'A started or completed workout cannot be moved.' }
  if (busy(s, to)) return { error: 'That date already has a started or completed workout.' }
  const source = snapshot(s, from), target = snapshot(s, to)
  if (!s.routines.some(r => r.id === source.id)) return { error: 'There is no workout to move on this date.' }
  if (target.id && !s.routines.some(r => r.id === target.id)) return { error: 'The destination routine no longer exists.' }
  return { from, to, source, target }
}

export function applyMove(s, plan, mode, today = todayISO()) {
  const current = planMove(s, plan.from, plan.to, today)
  if (current.error) return current
  if (!same(plan.source, current.source) || !same(plan.target, current.target)) return { error: 'The schedule changed. Review the dates again.' }
  if (current.target.id ? !['swap', 'replace'].includes(mode) : mode !== 'move') return { error: 'Choose whether to swap or replace the destination workout.' }
  if (mode === 'swap' && current.source.id === current.target.id) return { error: 'Both dates already have the same workout. Choose Replace to clear the original date.' }
  s.dayPlan[plan.from] = mode === 'swap' ? current.target.id : 'rest'
  s.dayPlan[plan.to] = current.source.id
  return { ...plan, afterSource: snapshot(s, plan.from), afterTarget: snapshot(s, plan.to) }
}

export function undoMove(s, receipt) {
  if (busy(s, receipt.from) || busy(s, receipt.to) || !same(snapshot(s, receipt.from), receipt.afterSource) || !same(snapshot(s, receipt.to), receipt.afterTarget)) return { error: 'These dates changed after the move. Undo is no longer available.' }
  for (const [date, before] of [[receipt.from, receipt.source], [receipt.to, receipt.target]]) {
    if (before.override === undefined) delete s.dayPlan[date]
    else s.dayPlan[date] = before.override
  }
  return {}
}
