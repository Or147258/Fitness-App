import React, { useMemo, useState } from 'react'
import { Flag, Pencil } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Sheet, toast } from './ui'
import { HE_MONTHS, addDays, fromKey, toKey } from '../lib/date'
import { fmtKg, rollingAverage, trend } from '../lib/weightStats'

const fmtDate = (d) => `${d.getDate()} ב${HE_MONTHS[d.getMonth()]} ${d.getFullYear()}`

/** חישוב היעד: התקדמות + תאריך משוער לפי קצב 30 הימים האחרונים */
export function goalStatus(weights, goal, start) {
  if (!goal || !weights.length) return null
  const current = rollingAverage(weights).at(-1).kg // ממוצע 7 ימים — פחות רגיש לתנודות יומיות
  const startKg = start?.kg ?? weights[0].kg
  const losing = goal < startKg
  const remaining = current - goal // חיובי = עוד צריך לרדת
  const reached = losing ? current <= goal : current >= goal
  // כמה מהדרך עברת: 0 = בנקודת ההתחלה, 1 = ביעד (התרחקות מהיעד = 0)
  const progress = startKg === goal ? 1 : Math.min(1, Math.max(0, (startKg - current) / (startKg - goal)))
  const tr = trend(weights, 30)
  let eta = null
  let towards = false
  if (tr && !reached) {
    towards = losing ? tr.perWeek < -0.02 : tr.perWeek > 0.02
    if (towards) {
      const weeks = Math.abs(remaining) / Math.abs(tr.perWeek)
      if (weeks < 260) eta = { weeks, date: addDays(fromKey(toKey()), Math.round(weeks * 7)) }
    }
  }
  return { current, startKg, losing, remaining, reached, progress, tr, eta, towards }
}

export function GoalCard() {
  const weights = useStore((s) => s.weights)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const st = useMemo(() => goalStatus(weights, settings.goalWeight, settings.goalStart), [weights, settings.goalWeight, settings.goalStart])

  const openSheet = () => { setValue(settings.goalWeight ? String(settings.goalWeight) : ''); setOpen(true) }
  const save = (e) => {
    e.preventDefault()
    const n = parseFloat(value.replace(',', '.'))
    if (!(n > 20 && n < 400)) return toast('הזן משקל יעד תקין')
    const current = weights.length ? Math.round(rollingAverage(weights).at(-1).kg * 10) / 10 : n
    updateSettings({ goalWeight: Math.round(n * 10) / 10, goalStart: { date: toKey(), kg: current } })
    setOpen(false)
    toast('היעד נשמר')
  }
  const remove = () => { updateSettings({ goalWeight: null, goalStart: null }); setOpen(false) }

  return (
    <>
      {!settings.goalWeight ? (
        <button onClick={openSheet} className="card flex w-full items-center gap-3 p-4 text-start">
          <span className="grid size-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300"><Flag size={20} /></span>
          <span className="flex-1">
            <span className="block font-semibold">הגדר משקל יעד</span>
            <span className="block text-xs text-zinc-500">האפליקציה תחשב מתי תגיע אליו לפי הקצב שלך</span>
          </span>
        </button>
      ) : (
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-lime-400/10 text-lime-300"><Flag size={20} /></span>
            <div className="flex-1">
              <div className="text-xs text-zinc-400">משקל יעד</div>
              <div className="tabular text-2xl font-bold">{fmtKg(settings.goalWeight)} <span className="text-sm font-normal text-zinc-500">ק״ג</span></div>
            </div>
            <button className="btn-icon" onClick={openSheet} aria-label="עריכת יעד"><Pencil size={16} /></button>
          </div>

          {st && (
            <>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${(st.reached ? 1 : st.progress) * 100}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
                <span>התחלה {fmtKg(st.startKg)}</span>
                <span>עכשיו {fmtKg(st.current)}</span>
                <span>יעד {fmtKg(settings.goalWeight)}</span>
              </div>
              <p className="mt-3 rounded-xl bg-ink-800 p-3 text-sm leading-relaxed text-zinc-300">
                {st.reached ? (
                  <>🎉 <b>הגעת ליעד!</b> אפשר להגדיר יעד חדש.</>
                ) : (
                  <>
                    נשארו <b>{fmtKg(Math.abs(st.remaining))} ק״ג</b>.{' '}
                    {st.eta ? (
                      <>בקצב הנוכחי תגיע ליעד בערך ב-<b>{fmtDate(st.eta.date)}</b> (עוד כ-{Math.max(1, Math.round(st.eta.weeks))} שבועות).</>
                    ) : st.tr ? (
                      'בקצב של 30 הימים האחרונים המשקל לא מתקדם לכיוון היעד.'
                    ) : (
                      'צריך עוד כמה שקילות כדי להעריך מתי תגיע ליעד.'
                    )}
                  </>
                )}
              </p>
            </>
          )}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="משקל יעד">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">יעד (ק״ג)</label>
            <input className="input tabular text-center text-lg font-semibold" inputMode="decimal" autoFocus aria-label="משקל יעד" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.0" />
            <p className="mt-1.5 text-xs text-zinc-500">נקודת ההתחלה תהיה הממוצע של השבוע האחרון.</p>
          </div>
          <button className="btn-primary w-full">שמור יעד</button>
          {settings.goalWeight && <button type="button" className="btn-danger w-full" onClick={remove}>הסר יעד</button>}
        </form>
      </Sheet>
    </>
  )
}
