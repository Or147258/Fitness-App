import React, { useMemo, useState } from 'react'
import { Droplet, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageHeader, Segmented, Empty, Sheet, ConfirmSheet } from '../components/ui'
import { DeltaBadge } from '../components/WeightEntry'
import { WeightChart } from '../components/WeightChart'
import { MetricsTabs } from '../components/MetricsTabs'
import { ReportButton } from './Pressure'
import { GlucoseForm, contextLabel } from '../components/GlucoseForm'
import { asKg, dailyAverages, describeDelta, monthlyAverages, trend, weeklyAverages } from '../lib/weightStats'
import { longDate, monthLabel, shortDate, toKey, weekStartKey } from '../lib/date'

const SUGAR_COLOR = '#fb923c'
const UNIT = 'mg/dL'
const fmt = (n) => (n == null || Number.isNaN(n) ? '—' : Math.round(n).toString())

function Stat({ label, value, children }) {
  return (
    <div className="card p-3.5">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="tabular mt-1 text-2xl font-bold">
        {value}{' '}
        <span className="text-xs font-normal text-zinc-500" dir="ltr">{UNIT}</span>
      </div>
      <div className="mt-1.5 min-h-[22px]">{children}</div>
    </div>
  )
}

const FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'fasting', label: 'בצום' },
  { value: 'after', label: 'אחרי ארוחה' },
]

export default function Sugar() {
  const glucose = useStore((s) => s.glucose)
  const deleteGlucose = useStore((s) => s.deleteGlucose)
  const [filter, setFilter] = useState('all')
  const [range, setRange] = useState(30)
  const [tab, setTab] = useState('daily')
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  // כל החישובים לפי הסינון: השוואה בין מדידות בצום למדידות בצום נותנת תמונה אמינה יותר
  const readings = useMemo(() => (filter === 'all' ? glucose : glucose.filter((g) => g.context === filter)), [glucose, filter])
  const weekly = useMemo(() => weeklyAverages(asKg(readings)), [readings])
  const monthly = useMemo(() => monthlyAverages(asKg(readings)), [readings])
  const daily = useMemo(() => dailyAverages(readings), [readings])
  const tr = useMemo(() => trend(daily, range === 365 ? 90 : range), [daily, range])
  const today = toKey()
  const thisWeek = weekly.find((w) => w.weekStart === weekStartKey(today))
  const thisMonth = monthly.find((m) => m.month === today.slice(0, 7))
  const todays = readings.filter((r) => r.date === today)
  const byDay = useMemo(() => {
    const map = new Map()
    for (const r of [...readings].reverse()) {
      if (!map.has(r.date)) map.set(r.date, [])
      map.get(r.date).push(r)
    }
    return [...map.entries()]
  }, [readings])

  return (
    <>
      <PageHeader title="סוכר בדם" subtitle={glucose.length ? `${glucose.length} מדידות` : undefined} action={<ReportButton />} />
      <MetricsTabs />
      <div className="space-y-4 px-4">
        <div className="card p-4"><GlucoseForm /></div>

        {!glucose.length ? (
          <Empty
            icon={Droplet}
            title="עוד אין מדידות"
            text="אפשר להזין כמה מדידות ביום. סמנו מתי נמדד (בצום, אחרי ארוחה...) כדי שהממוצעים וההשוואות יהיו מדויקים יותר."
          />
        ) : (
          <>
            <Segmented value={filter} onChange={setFilter} options={FILTERS} />

            {!readings.length ? (
              <p className="card px-4 py-6 text-center text-sm text-zinc-500">אין מדידות מהסוג הזה</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="היום" value={todays.length ? fmt(todays.reduce((a, r) => a + r.value, 0) / todays.length) : '—'}>
                    <span className="text-[11px] text-zinc-500">{todays.length ? `${todays.length} מדידות` : 'אין מדידה'}</span>
                  </Stat>
                  <Stat label="ממוצע שבועי" value={fmt(thisWeek?.avg)}>
                    <DeltaBadge d={thisWeek?.diff ?? null} digits={0} suffix="" neutral />
                  </Stat>
                  <Stat label="ממוצע חודשי" value={fmt(thisMonth?.avg)}>
                    <DeltaBadge d={thisMonth?.diff ?? null} digits={0} suffix="" neutral />
                  </Stat>
                </div>

                <div className="card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="font-semibold">מגמה</h2>
                    <Segmented
                      className="w-48"
                      value={range}
                      onChange={setRange}
                      options={[{ value: 30, label: '30 יום' }, { value: 90, label: '90 יום' }, { value: 365, label: 'שנה' }]}
                    />
                  </div>
                  {tr ? (
                    <div className="mb-3 rounded-xl bg-ink-800 p-3">
                      <DeltaBadge d={tr.perWeek} digits={1} suffix="לשבוע" neutral />
                      <p className="mt-1.5 text-sm text-zinc-300">
                        קצב של <b>{describeDelta(tr.perWeek, 1, UNIT).text}</b> בשבוע · סה״כ{' '}
                        <b>{describeDelta(tr.total, 0, UNIT).text}</b> ב-{tr.spanDays} הימים האחרונים
                      </p>
                    </div>
                  ) : (
                    <p className="mb-3 text-sm text-zinc-500">צריך מדידות מלפחות 3 ימים על פני שבוע כדי לחשב מגמה.</p>
                  )}
                  <WeightChart
                    weights={daily}
                    days={range}
                    color={SUGAR_COLOR}
                    digits={0}
                    minPad={5}
                    label="גרף סוכר"
                    emptyText="צריך מדידות משני ימים לפחות כדי להציג גרף"
                  />
                  <p className="mt-1 text-center text-[11px] text-zinc-500">קו כתום: ממוצע נע של 7 ימים · נקודות: ממוצע יומי</p>
                </div>

                <Segmented
                  value={tab}
                  onChange={setTab}
                  options={[{ value: 'daily', label: 'יומי' }, { value: 'weekly', label: 'שבועי' }, { value: 'monthly', label: 'חודשי' }]}
                />

                {tab === 'daily' && (
                  <div className="space-y-3">
                    {byDay.map(([date, list]) => (
                      <section key={date} className="card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                          <span className="text-sm font-medium">{longDate(date)}</span>
                          <span className="tabular text-xs text-zinc-500">
                            ממוצע {fmt(list.reduce((a, r) => a + r.value, 0) / list.length)}
                          </span>
                        </div>
                        <ul className="divide-y divide-white/5">
                          {list.map((r) => (
                            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                              <button className="flex min-w-0 flex-1 items-center gap-3 text-start" onClick={() => setEditing(r)}>
                                <span className="tabular w-11 text-xs text-zinc-500">{r.time}</span>
                                <span className="rounded-md bg-orange-400/10 px-1.5 py-0.5 text-[11px] font-medium text-orange-300">{contextLabel(r.context)}</span>
                                {r.note && <span className="truncate text-xs text-zinc-500">{r.note}</span>}
                              </button>
                              <span className="tabular font-semibold">{r.value}</span>
                              <button className="text-zinc-500 active:text-rose-300" onClick={() => setToDelete(r)} aria-label="מחק מדידה">
                                <Trash2 size={16} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                )}

                {tab === 'weekly' && (
                  <ul className="card divide-y divide-white/5">
                    {weekly.map((w) => (
                      <li key={w.weekStart} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium">שבוע <span dir="ltr">{shortDate(w.weekStart)}–{shortDate(w.weekEnd)}</span></div>
                          <div className="text-xs text-zinc-500">{w.count} מדידות · טווח {fmt(w.min)}–{fmt(w.max)}</div>
                        </div>
                        <DeltaBadge d={w.diff} digits={0} suffix="" neutral />
                        <span className="tabular w-12 text-start font-semibold">{fmt(w.avg)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {tab === 'monthly' && (
                  <ul className="card divide-y divide-white/5">
                    {monthly.map((m) => (
                      <li key={m.month} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{monthLabel(m.month)}</div>
                          <div className="text-xs text-zinc-500">
                            {m.count} מדידות · טווח {fmt(m.min)}–{fmt(m.max)}
                            {m.diff != null && ` · ${describeDelta(m.diff, 0, UNIT).text}`}
                          </div>
                        </div>
                        <DeltaBadge d={m.diff} digits={0} suffix="" neutral />
                        <span className="tabular w-12 text-start font-semibold">{fmt(m.avg)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}

        <p className="px-2 text-center text-[11px] leading-relaxed text-zinc-600">
          המעקב נועד לתיעוד אישי בלבד ואינו מחליף ייעוץ או מעקב רפואי.
        </p>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="עריכת מדידה">
        {editing && <GlucoseForm reading={editing} onDone={() => setEditing(null)} />}
      </Sheet>

      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="למחוק את המדידה?"
        message={toDelete && `${toDelete.value} ${UNIT} · ${contextLabel(toDelete.context)} · ${longDate(toDelete.date)} ${toDelete.time}`}
        confirmText="מחק"
        danger
        onConfirm={() => deleteGlucose(toDelete.id)}
      />
    </>
  )
}

