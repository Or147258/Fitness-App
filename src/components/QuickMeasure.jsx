import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, Droplet, HeartPulse, Scale } from 'lucide-react'
import { useStore } from '../store/useStore'
import { WeightEntry, DeltaBadge } from './WeightEntry'
import { GlucoseForm, contextLabel } from './GlucoseForm'
import { PressureForm } from './PressureForm'
import { asKg, fmtKg, trend, weeklyAverages } from '../lib/weightStats'
import { relativeDay, toKey, weekStartKey } from '../lib/date'
import { pressureGroups } from '../pages/Pressure'

const META = {
  weight: { label: 'משקל', icon: Scale, to: '/weight', on: 'bg-lime-400 text-ink-950', ring: 'ring-lime-400/60' },
  glucose: { label: 'סוכר', icon: Droplet, to: '/sugar', on: 'bg-orange-400 text-ink-950', ring: 'ring-orange-400/60' },
  pressure: { label: 'לחץ דם', icon: HeartPulse, to: '/pressure', on: 'bg-sky-400 text-ink-950', ring: 'ring-sky-400/60' },
}

function Mini({ label, value, unit, children }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="tabular text-xl font-bold">
        {value}{' '}<span className="text-xs font-normal text-zinc-500" dir={unit === 'ק״ג' ? undefined : 'ltr'}>{unit}</span>
      </div>
      {children}
    </div>
  )
}

/** כרטיס "המדידות של היום": מה כבר נמדד (✓) ומה עוד לא, והזנה מהירה */
export function QuickMeasure() {
  const { weights, glucose, pressure, settings } = useStore()
  const today = toKey()
  const metrics = ['weight', ...(settings.showGlucose ? ['glucose'] : []), ...(settings.showPressure ? ['pressure'] : [])]
  const todayCount = {
    weight: weights.some((w) => w.date === today) ? 1 : 0,
    glucose: glucose.filter((g) => g.date === today).length,
    pressure: pressure.filter((x) => x.date === today).length,
  }
  const [tab, setTab] = useState(() => metrics.find((m) => !todayCount[m]) ?? metrics[0])
  const active = metrics.includes(tab) ? tab : metrics[0]
  const missing = metrics.filter((m) => !todayCount[m])

  const wk = weekStartKey(today)
  const weightWeek = useMemo(() => weeklyAverages(weights).find((w) => w.weekStart === wk), [weights, wk])
  const tr = useMemo(() => trend(weights, 30), [weights])
  const sugarWeek = useMemo(() => weeklyAverages(asKg(glucose)).find((w) => w.weekStart === wk), [glucose, wk])
  const bpWeek = useMemo(() => pressureGroups(pressure, weeklyAverages).find((w) => w.key === wk), [pressure, wk])
  const lastSugar = glucose.at(-1)
  const lastBP = pressure.at(-1)

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">המדידות של היום</h2>
        <Link to={META[active].to} className="flex items-center text-xs text-zinc-400">לכל הנתונים <ChevronLeft size={14} /></Link>
      </div>

      {metrics.length > 1 && (
        <div className="mb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
          {metrics.map((m) => {
            const { label, icon: Icon, on, ring } = META[m]
            const done = todayCount[m] > 0
            return (
              <button
                key={m}
                onClick={() => setTab(m)}
                aria-pressed={active === m}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
                  active === m ? `bg-ink-700 ring-1 ${ring}` : 'bg-white/[0.04] text-zinc-400'
                }`}
              >
                <span className={`grid size-5 place-items-center rounded-full ${done ? on : 'border border-white/20'}`}>
                  {done ? <Check size={12} strokeWidth={3.5} /> : <Icon size={11} />}
                </span>
                {label}
              </button>
            )
          })}
        </div>
      )}

      {missing.length > 0 && (
        <p className="mb-3 text-xs text-zinc-500">עוד לא נמדד היום: {missing.map((m) => META[m].label).join(', ')}</p>
      )}
      {!missing.length && metrics.length > 1 && <p className="mb-3 text-xs text-emerald-300/80">✓ כל המדידות של היום הוזנו</p>}

      {active === 'weight' && <WeightEntry showDate={false} />}
      {active === 'glucose' && <GlucoseForm compact />}
      {active === 'pressure' && <PressureForm compact />}

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
        {active === 'weight' && (
          <>
            <Mini label="ממוצע שבועי" value={fmtKg(weightWeek?.avg)} unit="ק״ג">
              <DeltaBadge d={weightWeek?.diff ?? null} className="mt-1" />
            </Mini>
            <Mini label="קצב (30 יום)" value={tr ? <span dir="ltr">{`${tr.perWeek > 0 ? '+' : tr.perWeek < 0 ? '−' : ''}${Math.abs(tr.perWeek).toFixed(2)}`}</span> : '—'} unit="ק״ג לשבוע" />
          </>
        )}
        {active === 'glucose' && (
          <>
            <Mini label="מדידה אחרונה" value={lastSugar?.value ?? '—'} unit="mg/dL">
              {lastSugar && <div className="text-xs text-zinc-500">{relativeDay(lastSugar.date)} {lastSugar.time} · {contextLabel(lastSugar.context)}</div>}
            </Mini>
            <Mini label="ממוצע שבועי" value={sugarWeek ? Math.round(sugarWeek.avg) : '—'} unit="mg/dL">
              <DeltaBadge d={sugarWeek?.diff ?? null} digits={0} suffix="" neutral className="mt-1" />
            </Mini>
          </>
        )}
        {active === 'pressure' && (
          <>
            <Mini label="מדידה אחרונה" value={lastBP ? <span dir="ltr">{lastBP.sys}/{lastBP.dia}</span> : '—'} unit="mmHg">
              {lastBP && <div className="text-xs text-zinc-500">{relativeDay(lastBP.date)} {lastBP.time}{lastBP.pulse != null && ` · דופק ${lastBP.pulse}`}</div>}
            </Mini>
            <Mini label="ממוצע שבועי" value={bpWeek ? <span dir="ltr">{Math.round(bpWeek.sys.avg)}/{Math.round(bpWeek.dia?.avg)}</span> : '—'} unit="mmHg">
              <DeltaBadge d={bpWeek?.sys.diff ?? null} digits={0} suffix="עליון" neutral className="mt-1" />
            </Mini>
          </>
        )}
      </div>
    </section>
  )
}
