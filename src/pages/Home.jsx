import React from 'react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Dumbbell, Play, Settings, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WeightEntry, DeltaBadge } from '../components/WeightEntry'
import { fmtDuration, HE_DAYS, HE_MONTHS, relativeDay, toKey, weekStartKey } from '../lib/date'
import { fmtKg, trend, weeklyAverages } from '../lib/weightStats'
import { programColor } from '../lib/colors'
import { sessionSetCount } from '../lib/prs'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'לילה טוב'
  if (h < 12) return 'בוקר טוב'
  if (h < 17) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}

export default function Home() {
  const weights = useStore((s) => s.weights)
  const sessions = useStore((s) => s.sessions)
  const programs = useStore((s) => s.programs)
  const active = useStore((s) => s.active)
  const startWorkout = useStore((s) => s.startWorkout)
  const navigate = useNavigate()
  const now = new Date()
  const today = toKey()

  const weekly = useMemo(() => weeklyAverages(weights), [weights])
  const thisWeek = weekly.find((w) => w.weekStart === weekStartKey(today))
  const tr = useMemo(() => trend(weights, 30), [weights])
  const sorted = useMemo(() => [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [sessions])

  // האימון הבא בסבב: זה שאחרי האימון האחרון שביצעת
  const next = useMemo(() => {
    const usable = programs.filter((p) => p.exercises.length)
    if (!usable.length) return null
    const last = sorted.find((s) => usable.some((p) => p.id === s.programId))
    if (!last) return usable[0]
    const i = usable.findIndex((p) => p.id === last.programId)
    return usable[(i + 1) % usable.length]
  }, [programs, sorted])

  const weekCount = sessions.filter((s) => s.date >= weekStartKey(today)).length
  const monthCount = sessions.filter((s) => s.date.startsWith(today.slice(0, 7))).length

  return (
    <div className="px-4 pt-safe">
      <header className="flex items-center gap-3 py-5">
        <div className="flex-1">
          <p className="text-sm text-zinc-400">יום {HE_DAYS[now.getDay()]}, {now.getDate()} ב{HE_MONTHS[now.getMonth()]}</p>
          <h1 className="text-[26px] font-extrabold">{greeting()} 👋</h1>
        </div>
        <Link to="/settings" className="btn-icon rounded-full" aria-label="הגדרות"><Settings size={20} /></Link>
      </header>

      <div className="space-y-4">
        {/* האימון הבא */}
        {!active && (
          next ? (
            <div className="relative overflow-hidden rounded-3xl bg-lime-400 p-5 text-ink-950">
              <Dumbbell size={120} className="absolute -bottom-6 -start-6 rotate-[-20deg] opacity-10" />
              <p className="text-sm font-medium opacity-70">האימון הבא שלך</p>
              <h2 className="mt-0.5 text-3xl font-extrabold">{next.name}</h2>
              <p className="text-sm opacity-70">{next.exercises.length} תרגילים</p>
              <button
                className="btn mt-4 h-12 w-full bg-ink-950 text-base text-lime-300"
                onClick={() => { startWorkout(next.id); navigate('/active') }}
              >
                <Play size={18} className="fill-current" /> התחל אימון
              </button>
            </div>
          ) : (
            <Link to="/workouts" className="card flex items-center gap-4 p-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-lime-400/10 text-lime-300"><Dumbbell /></div>
              <div className="flex-1">
                <div className="font-bold">בנה את תוכנית האימונים</div>
                <div className="text-sm text-zinc-400">הגדר אימונים והוסף תרגילים מהמאגר</div>
              </div>
              <ChevronLeft className="text-zinc-500" />
            </Link>
          )
        )}

        {/* משקל */}
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">שקילה יומית</h2>
            <Link to="/weight" className="flex items-center text-xs text-zinc-400">לכל הנתונים <ChevronLeft size={14} /></Link>
          </div>
          <WeightEntry showDate={false} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
            <div>
              <div className="text-xs text-zinc-500">ממוצע שבועי</div>
              <div className="tabular text-xl font-bold">{fmtKg(thisWeek?.avg)} <span className="text-xs font-normal text-zinc-500">ק״ג</span></div>
              <DeltaBadge d={thisWeek?.diff ?? null} className="mt-1" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                {tr && tr.perWeek < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />} קצב (30 יום)
              </div>
              <div className="tabular text-xl font-bold" dir="ltr" style={{ textAlign: 'right' }}>
                {tr ? `${tr.perWeek > 0 ? '+' : tr.perWeek < 0 ? '−' : ''}${Math.abs(tr.perWeek).toFixed(2)}` : '—'}
              </div>
              <div className="text-xs text-zinc-500">ק״ג לשבוע</div>
            </div>
          </div>
        </section>

        {/* סטטיסטיקה */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-xs text-zinc-500">אימונים השבוע</div>
            <div className="tabular text-3xl font-extrabold">{weekCount}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-zinc-500">אימונים החודש</div>
            <div className="tabular text-3xl font-extrabold">{monthCount}</div>
          </div>
        </div>

        {/* אחרונים */}
        {sorted.length > 0 && (
          <section>
            <div className="mb-2 mt-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-zinc-400">אימונים אחרונים</h2>
              <Link to="/calendar" className="flex items-center text-xs text-zinc-400">ליומן <ChevronLeft size={14} /></Link>
            </div>
            <ul className="card divide-y divide-white/5">
              {sorted.slice(0, 4).map((s) => {
                const c = programColor(programs, s.programId, s.programName)
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`size-2.5 rounded-full ${c.dot}`} />
                    <div className="flex-1">
                      <div className="font-medium">{s.programName}</div>
                      <div className="text-xs text-zinc-500">{sessionSetCount(s)} סטים · {fmtDuration(s.durationSec)}</div>
                    </div>
                    <span className="text-xs text-zinc-400">{relativeDay(s.date)}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
