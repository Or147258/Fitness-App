// תזכורות יומיות דרך יומן הטלפון: קובץ .ics עם אירוע חוזר כל יום + התראה.
// עובד באייפון ובאנדרואיד בלי שרת ובלי הרשאות התראה.
import { pad, toKey } from './date'

const esc = (t) => String(t).replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')

/** items: [{ key, title, time: 'HH:MM' }] */
export function buildICS(items, url) {
  const day = toKey().replace(/-/g, '')
  const events = items.map(({ key, title, time }) => {
    const [h, m] = time.split(':').map(Number)
    return [
      'BEGIN:VEVENT',
      `UID:fitness-${key}-${Date.now()}@yoman-kosher`,
      `DTSTAMP:${stamp()}`,
      `DTSTART:${day}T${pad(h)}${pad(m)}00`, // שעה מקומית של הטלפון
      'DURATION:PT5M',
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(title)}`,
      `DESCRIPTION:${esc(`תזכורת מיומן כושר — ${url}`)}`,
      `URL:${url}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(title)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n')
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Or Chen//Yoman Kosher//HE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...events, 'END:VCALENDAR'].join('\r\n')
}

export function downloadICS(items) {
  const ics = buildICS(items, window.location.origin)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'yoman-kosher-reminders.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

export const REMINDER_TITLES = {
  weight: 'שקילה יומית ⚖️',
  glucose: 'מדידת סוכר 🩸',
  pressure: 'מדידת לחץ דם ❤️',
}
