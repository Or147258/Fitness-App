// צבע קבוע לכל תוכנית (לפי הסדר שלה) — מופיע ביומן ובכרטיסים
export const PROGRAM_COLORS = [
  { dot: 'bg-lime-400', pill: 'bg-lime-400/15 text-lime-300', bar: 'bg-lime-400' },
  { dot: 'bg-sky-400', pill: 'bg-sky-400/15 text-sky-300', bar: 'bg-sky-400' },
  { dot: 'bg-violet-400', pill: 'bg-violet-400/15 text-violet-300', bar: 'bg-violet-400' },
  { dot: 'bg-amber-400', pill: 'bg-amber-400/15 text-amber-300', bar: 'bg-amber-400' },
  { dot: 'bg-rose-400', pill: 'bg-rose-400/15 text-rose-300', bar: 'bg-rose-400' },
  { dot: 'bg-teal-400', pill: 'bg-teal-400/15 text-teal-300', bar: 'bg-teal-400' },
  { dot: 'bg-orange-400', pill: 'bg-orange-400/15 text-orange-300', bar: 'bg-orange-400' },
]

const hash = (s = '') => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function programColor(programs, programId, name) {
  const i = programs.findIndex((p) => p.id === programId)
  return PROGRAM_COLORS[(i >= 0 ? i : hash(name)) % PROGRAM_COLORS.length]
}
