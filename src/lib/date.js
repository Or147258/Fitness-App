// כל התאריכים נשמרים כמחרוזת מקומית 'YYYY-MM-DD' (בלי בעיות אזור זמן)
export const pad = (n) => String(n).padStart(2, '0')

export const toKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)

// השבוע בישראל מתחיל ביום ראשון
export const weekStartKey = (k) => {
  const d = fromKey(k)
  return toKey(addDays(d, -d.getDay()))
}

export const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
export const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
export const HE_DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export const shortDate = (k) => {
  const d = fromKey(k)
  return `${d.getDate()}.${d.getMonth() + 1}`
}

export const longDate = (k) => {
  const d = fromKey(k)
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()]}`
}

export const monthLabel = (mk) => {
  const [y, m] = mk.split('-').map(Number)
  return `${HE_MONTHS[m - 1]} ${y}`
}

export const relativeDay = (k) => {
  const diff = daysBetween(k, toKey())
  if (diff === 0) return 'היום'
  if (diff === 1) return 'אתמול'
  if (diff < 7) return `לפני ${diff} ימים`
  return shortDate(k)
}

export const fmtClock = (totalSec) => {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export const fmtDuration = (totalSec) => {
  const m = Math.round(totalSec / 60)
  if (m < 60) return `${m} דק׳`
  return `${Math.floor(m / 60)} ש׳ ${m % 60} דק׳`
}

export const timeOfDay = (iso) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
