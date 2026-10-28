import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, HeartPulse, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageHeader, Segmented, Empty, Sheet, ConfirmSheet } from '../components/ui'
import { DeltaBadge } from '../components/WeightEntry'
import { LineChart } from '../components/LineChart'
import { MetricsTabs } from '../components/MetricsTabs'
import { PressureForm, fmtBP } from '../components/PressureForm'
import { dailyAverages, describeDelta, monthlyAverages, trend, weeklyAverages } from '../lib/weightStats'
import { longDate, monthLabel, shortDate, toKey, weekStartKey } from '../lib/date'

export const BP_COLORS = { sys: '#38bdf8', dia: '#a78bfa', pulse: '#f472b6' }
const r0 = (n) => (n == null || Number.isNaN(n) ? '—' : Math.round(n))

/** ממוצעים שבועיים/חודשיים לכל שדה בנפרד, מאוחדים לפי מפתח התקופה */
export function pressureGroups(items, groupFn) {
  const field = (f) => groupFn(items.filter((x) => x[f] != null).map((x) => ({ date: x.date, kg: x[f] })))
  const sys = field('sys')
  const dia = Object.fromEntries(field('dia').map((r) => [r.key, r]))
  const pulse = Object.fromEntries(field('pulse').map((r) => [r.key, r]))
  return sys.map((r) => ({ ...r, sys: r, dia: dia[r.key], pulse: pulse[r.key] }))
}

function BPValue({ sys, dia }) {
  return (
    <span className="tabular" dir="ltr">
      {r0(sys)}<span className="text-zinc-500">/</span>{r0(dia)}
    </span>
  )
}

export function ReportButton() {
  return (
    <Link to="/report" className="btn-ghost h-10 px-3 text-sm">
      <FileText size={16} /> דוח לרופא
    </Link>
  )
}

export default function Pressure() {
  const pressure = useStore((s) => s.pressure)
  const deletePressure = useStore((s) => s.deletePressure)
  const [range, setRange] = useState(30)
  const [tab, setTab] = useState('daily')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  const today = toKey()
  const weekly = useMemo(() => pressureGroups(pressure, weeklyAverages), [pressure])
  const monthly = useMemo(() => pressureGroups(pressure, monthlyAverages), [pressure])
  const dailySys = useMemo(() => dailyAverages(pressure, (x) => x.sys), [pressure])
  const dailyDia = useMemo(() => dailyAverages(pressure, (x) => x.dia), [pressure])
  const dailyPulse = useMemo(() => dailyAverages(pressure.filter((x) => x.pulse != null), (x) => x.pulse), [pressure])
  const days = range === 365 ? 90 : range
  const trSys = useMemo(() => trend(dailySys, days), [dailySys, days])
  const trDia = useMemo(() => trend(dailyDia, days), [dailyDia, days])
  const thisWeek = weekly.find((w) => w.key === weekStartKey(today))
  const thisMonth = monthly.find((m) => m.key === today.slice(0, 7))
  const todays = pressure.filter((x) => x.date === today)
  const byDay = useMemo(() => {
    const map = new Map()
    for (const x of [...pressure].reverse()) {
      if (!map.has(x.date)) map.set(x.date, [])
      map.get(x.date).push(x)
    }
    return [...map.entries()]
  }, [pressure])
  const toPts = (arr) => arr.map((d) => ({ date: d.date, v: d.kg }))

  return (
    <>
      <PageHeader title="לחץ דם" subtitle={pressure.length ? `${pressure.length} מדידות` : undefined} action={<ReportButton />} />
      <MetricsTabs />
      <div className="space-y-4 px-4">
        <div className="card p-4"><PressureForm /></div>

        {!pressure.length ? (
          <Empty icon={HeartPulse} title="עוד אין מדידות" text="הזינו לחץ עליון ותחתון (ודופק אם המכשיר מציג). אפשר כמה מדידות ביום." />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['היום', todays.length ? { sys: todays.reduce((a, x) => a + x.sys, 0) / todays.length, dia: todays.reduce((a, x) => a + x.dia, 0) / todays.length } : null, null, todays.length ? `${todays.length} מדידות` : 'אין מדידה'],
                ['ממוצע שבועי', thisWeek ? { sys: thisWeek.sys.avg, dia: thisWeek.dia?.avg } : null, thisWeek?.sys.diff],
                ['ממוצע חודשי', thisMonth ? { sys: thisMonth.sys.avg, dia: thisMonth.dia?.avg } : null, thisMonth?.sys.diff],
              ].map(([label, v, diff, sub]) => (
                <div key={label} className="card p-3">
                  <div className="text-xs text-zinc-400">{label}</div>
                  <div className="mt-1 text-xl font-bold">{v ? <BPValue {...v} /> : '—'}</div>
                  <div className="mt-1.5 min-h-[22px]">
                    {sub ? <span className="text-[11px] text-zinc-500">{sub}</span> : <DeltaBadge d={diff ?? null} digits={0} suffix="עליון" neutral />}
                  </div>
                </div>
              ))}
            </div>

            <div className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold">מגמה</h2>
                <Segmented className="w-48" value={range} onChange={setRange} options={[{ value: 30, label: '30 יום' }, { value: 90, label: '90 יום' }, { value: 365, label: 'שנה' }]} />
              </div>
              {trSys && trDia ? (
                <div className="mb-3 space-y-1.5 rounded-xl bg-ink-800 p-3 text-sm text-zinc-300">
                  <p>עליון: <b>{describeDelta(trSys.perWeek, 1, 'mmHg').text}</b> בשבוע</p>
                  <p>תחתון: <b>{describeDelta(trDia.perWeek, 1, 'mmHg').text}</b> בשבוע</p>
                </div>
              ) : (
                <p className="mb-3 text-sm text-zinc-500">צריך מדידות מלפחות 3 ימים על פני שבוע כדי לחשב מגמה.</p>
              )}
              <LineChart
                days={range}
                minPad={5}
                label="גרף לחץ דם"
                emptyText="צריך מדידות משני ימים לפחות כדי להציג גרף"
                series={[
                  { label: 'עליון', color: BP_COLORS.sys, points: toPts(dailySys) },
                  { label: 'תחתון', color: BP_COLORS.dia, points: toPts(dailyDia) },
                ]}
              />
              <p className="mt-1 text-center text-[11px] text-zinc-500">ממוצע יומי · mmHg{dailyPulse.length > 0 && ` · דופק ממוצע ${Math.round(dailyPulse.reduce((a, d) => a + d.kg, 0) / dailyPulse.length)}`}</p>
            </div>

            <Segmented value={tab} onChange={setTab} options={[{ value: 'daily', label: 'יומי' }, { value: 'weekly', label: 'שבועי' }, { value: 'monthly', label: 'חודשי' }]} />

            {tab === 'daily' && (
              <div className="space-y-3">
                {byDay.map(([date, list]) => (
                  <section key={date} className="card overflow-hidden">
                    <div className="border-b border-white/5 px-4 py-2.5 text-sm font-medium">{longDate(date)}</div>
                    <ul className="divide-y divide-white/5">
                      {list.map((x) => (
                        <li key={x.id} className="flex items-center gap-3 px-4 py-2.5">
                          <button className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setEditing(x)}>
                            <span className="tabular w-11 text-xs text-zinc-500">{x.time}</span>
                            {x.pulse != null && <span className="rounded-md bg-pink-400/10 px-1.5 py-0.5 text-[11px] text-pink-300">דופק {x.pulse}</span>}
                            {x.note && <span className="truncate text-xs text-zinc-500">{x.note}</span>}
                          </button>
                          <span className="font-semibold"><BPValue sys={x.sys} dia={x.dia} /></span>
                          <button className="text-zinc-500 active:text-rose-300" onClick={() => setToDelete(x)} aria-label="מחק מדידה">
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {(tab === 'weekly' || tab === 'monthly') && (
              <ul className="card divide-y divide-white/5">
                {(tab === 'weekly' ? weekly : monthly).map((r) => (
                  <li key={r.key} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {tab === 'weekly' ? <>שבוע <span dir="ltr">{shortDate(r.key)}–{shortDate(r.weekEnd)}</span></> : monthLabel(r.key)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {r.sys.count} מדידות{r.pulse ? ` · דופק ${r0(r.pulse.avg)}` : ''}
                      </div>
                    </div>
                    <DeltaBadge d={r.sys.diff} digits={0} suffix="" neutral />
                    <span className="w-16 text-start font-semibold"><BPValue sys={r.sys.avg} dia={r.dia?.avg} /></span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-600">המעקב נועד לתיעוד אישי בלבד ואינו מחליף ייעוץ או מעקב רפואי.</p>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="עריכת מדידה">
        {editing && <PressureForm reading={editing} onDone={() => setEditing(null)} />}
      </Sheet>
      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="למחוק את המדידה?"
        message={toDelete && `${fmtBP(toDelete)} · ${longDate(toDelete.date)} ${toDelete.time}`}
        confirmText="מחק"
        danger
        onConfirm={() => deletePressure(toDelete.id)}
      />
    </>
  )
}
