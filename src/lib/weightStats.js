import { addDays, daysBetween, fromKey, toKey, weekStartKey } from './date'

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

function groupAverages(weights, keyFn) {
  const map = new Map()
  for (const w of weights) {
    const k = keyFn(w.date)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(w.kg)
  }
  const rows = [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, arr]) => ({ key, avg: mean(arr), count: arr.length, min: Math.min(...arr), max: Math.max(...arr) }))
  rows.forEach((r, i) => { r.diff = i ? r.avg - rows[i - 1].avg : null })
  return rows.reverse() // החדש ביותר ראשון
}

/** ממוצע לכל שבוע (ראשון–שבת) + הפרש מהשבוע הקודם */
export function weeklyAverages(weights) {
  return groupAverages(weights, weekStartKey).map((r) => ({
    ...r,
    weekStart: r.key,
    weekEnd: toKey(addDays(fromKey(r.key), 6)),
  }))
}

/** ממוצע לכל חודש קלנדרי + הפרש מהחודש הקודם */
export function monthlyAverages(weights) {
  return groupAverages(weights, (k) => k.slice(0, 7)).map((r) => ({ ...r, month: r.key }))
}

/**
 * מגמה: רגרסיה ליניארית על השקילות ב-N הימים האחרונים.
 * מחזיר קצב בק״ג לשבוע ואת השינוי הכולל לאורך התקופה.
 */
export function trend(weights, days = 30, today = toKey()) {
  const from = toKey(addDays(fromKey(today), -(days - 1)))
  const pts = weights.filter((w) => w.date >= from && w.date <= today)
  if (pts.length < 3) return null
  const xs = pts.map((p) => daysBetween(pts[0].date, p.date))
  const span = xs[xs.length - 1]
  if (span < 5) return null
  const ys = pts.map((p) => p.kg)
  const mx = mean(xs)
  const my = mean(ys)
  let num = 0
  let den = 0
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2 })
  const slope = den ? num / den : 0 // ק״ג ליום
  return { perWeek: slope * 7, total: slope * span, spanDays: span, n: pts.length }
}

/** ממוצע נע של 7 ימים — מחליק תנודות יומיות (מים, מלח וכו׳) */
export function rollingAverage(weights, window = 7) {
  return weights.map((w) => {
    const from = toKey(addDays(fromKey(w.date), -(window - 1)))
    const inWin = weights.filter((x) => x.date >= from && x.date <= w.date)
    return { date: w.date, kg: mean(inWin.map((x) => x.kg)) }
  })
}

export const fmtKg = (n, digits = 1) => (n == null || Number.isNaN(n) ? '—' : Number(n).toFixed(digits))

/** תיאור מילולי של שינוי: "ירידה של 0.8 ק״ג" */
export function describeDelta(d, digits = 1, unit = 'ק״ג') {
  if (d == null) return { dir: 'none', text: 'אין נתון להשוואה' }
  const abs = Math.abs(d)
  if (abs < 0.05) return { dir: 'flat', text: 'ללא שינוי' }
  return {
    dir: d < 0 ? 'down' : 'up',
    text: `${d < 0 ? 'ירידה' : 'עלייה'} של ${abs.toFixed(digits)} ${unit}`,
  }
}

/** האם השינוי בכיוון הרצוי לפי מטרת המשתמש */
export function deltaTone(dir, goal) {
  if (dir === 'flat') return goal === 'maintain' ? 'good' : 'neutral'
  if (dir === 'none') return 'neutral'
  if (goal === 'cut') return dir === 'down' ? 'good' : 'bad'
  if (goal === 'bulk') return dir === 'up' ? 'good' : 'bad'
  return 'neutral'
}

/** ממוצע לכל יום (לסוכר: כמה מדידות ביום) → [{ date, kg }] כדי להשתמש באותם חישובים כמו במשקל */
export function dailyAverages(readings, value = (r) => r.value) {
  const map = new Map()
  for (const r of readings) {
    if (!map.has(r.date)) map.set(r.date, [])
    map.get(r.date).push(value(r))
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, arr]) => ({ date, kg: mean(arr), count: arr.length }))
}

/** ממוצעים שבועיים/חודשיים לפי כל המדידות (לא לפי ממוצע יומי) */
export const asKg = (readings) => readings.map((r) => ({ date: r.date, kg: r.value }))
