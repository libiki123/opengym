import { restSeconds } from './history.js'

const obj = x => !!x && typeof x === 'object' && !Array.isArray(x)

export function validBackup(s) {
  const map = x => obj(x) && Object.values(x).every(v => v != null)
  const entries = xs => Array.isArray(xs) && xs.every(e => obj(e) && typeof e.id === 'string' && Array.isArray(e.sets) && e.sets.every(set => obj(set) && typeof set.done === 'boolean'))
  return obj(s) && Array.isArray(s.workouts) && Array.isArray(s.routines) &&
    (!('bodyweight' in s) || Array.isArray(s.bodyweight) && s.bodyweight.every(x => obj(x) && typeof x.d === 'string' && Number.isFinite(x.w))) &&
    (!('bodyfat' in s) || Array.isArray(s.bodyfat) && s.bodyfat.every(x => obj(x) && typeof x.d === 'string' && Number.isFinite(x.pct) && x.pct > 0 && x.pct < 100)) &&
    (!('customEx' in s) || Array.isArray(s.customEx) && s.customEx.every(x => obj(x) && typeof x.id === 'string' && typeof x.n === 'string' && typeof x.bp === 'string' && (!('tg' in x) || typeof x.tg === 'string') && (!('eq' in x) || typeof x.eq === 'string'))) &&
    (!('week' in s) || map(s.week) && Object.values(s.week).every(v => typeof v === 'string')) &&
    (!('dayPlan' in s) || map(s.dayPlan) && Object.values(s.dayPlan).every(v => typeof v === 'string')) &&
    (!('exWeights' in s) || obj(s.exWeights) && Object.values(s.exWeights).every(x => obj(x) && Number.isFinite(x.w))) &&
    s.workouts.every(w => obj(w) && typeof w.d === 'string' && entries(w.entries)) &&
    s.routines.every(r => obj(r) && typeof r.id === 'string' && typeof r.name === 'string' && Array.isArray(r.ex) && r.ex.every(e => obj(e) && typeof e.id === 'string' && (!('restSec' in e) || restSeconds(e) !== undefined))) &&
    (s.active == null || obj(s.active) && typeof s.active.id === 'string' && typeof s.active.name === 'string' && Number.isFinite(s.active.start) && Number.isInteger(s.active.cur) && entries(s.active.entries))
}
