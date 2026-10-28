import React from 'react'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react'
import { useExerciseMap, useStore } from '../store/useStore'
import { PageHeader, ConfirmSheet, toast } from '../components/ui'
import { HE_DAYS_SHORT, HE_MONTHS, fmtDuration, longDate, pad, timeOfDay, toKey } from '../lib/date'
import { programColor } from '../lib/colors'
import { fmtSet, sessionSetCount } from '../lib/prs'

export default function Calendar() {
  const sessions = useStore((s) => s.sessions)
  const programs = useStore((s) => s.programs)
  const weights = useStore((s) => s.weights)
  const deleteSession = useStore((s) => s.deleteSession)
  const exMap = useExerciseMap()
  const today = toKey()
  const [cursor, setCursor] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }))
  const [selected, setSelected] = useState(today)
  const [toDelete, setToDelete] = useState(null)

  const byDate = useMemo(() => {
    const map = {}
    for (const s of sessions) (map[s.date] ??= []).push(s)
    return map
  }, [sessions])
  const weightDates = useMemo(() => new Set(weights.map((w) => w.date)), [weights])

  const { y, m } = cursor
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const monthPrefix = `${y}-${pad(m + 1)}`
  const monthSessions = sessions.filter((s) => s.date.startsWith(monthPrefix))
  const monthTime = monthSessions.reduce((t, s) => t + s.durationSec, 0)
  const daySessions = byDate[selected] ?? []

  const shift = (d) =>
    setCursor(({ y, m }) => {
      const date = new Date(y, m + d, 1)
      return { y: date.getFullYear(), m: date.getMonth() }
    })

  return (
    <>
      <PageHeader title="יומן אימונים" />
      <div className="space-y-4 px-4">
        <div className="card p-3">
          <div className="mb-3 flex items-center justify-between">
            <button className="btn-icon rounded-full" onClick={() => shift(-1)} aria-label="חודש קודם"><ChevronRight size={20} /></button>
            <div className="text-center">
              <div className="font-bold">{HE_MONTHS[m]} {y}</div>
              <div className="text-xs text-zinc-500">{monthSessions.length} אימונים · {fmtDuration(monthTime)}</div>
            </div>
            <button className="btn-icon rounded-full" onClick={() => shift(1)} aria-label="חודש הבא"><ChevronLeft size={20} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-500">
            {HE_DAYS_SHORT.map((d) => <div key={d} className="pb-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const key = `${monthPrefix}-${pad(day)}`
              const list = byDate[key] ?? []
              const isSel = key === selected
              const isToday = key === today
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`relative flex h-[62px] flex-col items-center rounded-xl pt-1.5 transition ${isSel ? 'bg-white/10 ring-1 ring-lime-400/60' : list.length ? 'bg-white/[0.04]' : ''}`}
                >
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${isToday ? 'bg-lime-400 text-ink-950' : key > today ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {day}
                  </span>
                  {list.slice(0, 2).map((s) => {
                    const c = programColor(programs, s.programId, s.programName)
                    return (
                      <span key={s.id} className={`mt-0.5 w-[92%] truncate rounded px-0.5 text-[9px] font-semibold leading-[14px] ${c.pill}`}>
                        {s.programName}
                      </span>
                    )
                  })}
                  {weightDates.has(key) && !list.length && <span className="mt-1.5 size-1 rounded-full bg-zinc-500" title="שקילה" />}
                </button>
              )
            })}
          </div>
        </div>

        <section>
          <h2 className="section-title mt-0">{longDate(selected)}</h2>
          {!daySessions.length && <p className="card px-4 py-6 text-center text-sm text-zinc-500">לא היה אימון ביום הזה</p>}
          <div className="space-y-3">
            {daySessions.map((s) => {
              const c = programColor(programs, s.programId, s.programName)
              return (
                <article key={s.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <span className={`size-3 rounded-full ${c.dot}`} />
                    <div className="flex-1">
                      <h3 className="font-bold">{s.programName}</h3>
                      <p className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock size={12} /> {timeOfDay(s.startedAt)} · {fmtDuration(s.durationSec)} · {sessionSetCount(s)} סטים
                      </p>
                    </div>
                    <button className="p-2 text-zinc-500 active:text-rose-300" onClick={() => setToDelete(s)} aria-label="מחק אימון">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                    {s.exercises.map((ex, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="min-w-0 flex-1 truncate text-zinc-300">{exMap[ex.exerciseId]?.name ?? 'תרגיל'}</span>
                        <span className="tabular shrink-0 text-xs text-zinc-500" dir="ltr">{ex.sets.map(fmtSet).join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })}
          </div>
        </section>
      </div>

      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="למחוק את האימון מהיומן?"
        message="השיאים האישיים יחושבו מחדש בלי האימון הזה."
        confirmText="מחק"
        danger
        onConfirm={() => { deleteSession(toDelete.id); toast('האימון נמחק') }}
      />
    </>
  )
}
