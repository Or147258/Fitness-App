import React from 'react'
import { useMemo, useState } from 'react'
import { Scale, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PageHeader, Segmented, Empty, ConfirmSheet } from '../components/ui'
import { WeightEntry, DeltaBadge } from '../components/WeightEntry'
import { WeightChart } from '../components/WeightChart'
import { describeDelta, fmtKg, monthlyAverages, trend, weeklyAverages } from '../lib/weightStats'
import { longDate, monthLabel, shortDate, toKey, weekStartKey } from '../lib/date'

function Stat({ label, value, children }) {
  return (
    <div className="card p-3.5">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="tabular mt-1 text-2xl font-bold">{value}<span className="ms-1 text-sm font-normal text-zinc-500">ק״ג</span></div>
      <div className="mt-1.5 min-h-[22px]">{children}</div>
    </div>
  )
}

export default function Weight() {
  const weights = useStore((s) => s.weights)
  const deleteWeight = useStore((s) => s.deleteWeight)
  const [range, setRange] = useState(30)
  const [tab, setTab] = useState('weekly')
  const [toDelete, setToDelete] = useState(null)

  const weekly = useMemo(() => weeklyAverages(weights), [weights])
  const monthly = useMemo(() => monthlyAverages(weights), [weights])
  const tr = useMemo(() => trend(weights, range === 365 ? 90 : range), [weights, range])
  const thisWeek = weekly.find((w) => w.weekStart === weekStartKey(toKey()))
  const thisMonth = monthly.find((m) => m.month === toKey().slice(0, 7))
  const daily = useMemo(() => [...weights].reverse(), [weights])

  if (!weights.length) {
    return (
      <>
        <PageHeader title="מעקב משקל" />
        <div className="space-y-4 px-4">
          <div className="card p-4"><WeightEntry /></div>
          <Empty icon={Scale} title="עוד אין שקילות" text="מומלץ להישקל כל בוקר באותם תנאים. האפליקציה תחשב ממוצע שבועי וחודשי ותראה לך את המגמה." />
        </div>
      </>
    )
  }

  const trendText = tr ? describeDelta(tr.perWeek, 2) : null

  return (
    <>
      <PageHeader title="מעקב משקל" subtitle={`${weights.length} שקילות`} />
      <div className="space-y-4 px-4">
        <div className="card p-4"><WeightEntry /></div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="ממוצע השבוע" value={fmtKg(thisWeek?.avg)}>
            <DeltaBadge d={thisWeek?.diff ?? null} />
            <span className="ms-1.5 text-[11px] text-zinc-500">מול שבוע קודם</span>
          </Stat>
          <Stat label="ממוצע החודש" value={fmtKg(thisMonth?.avg)}>
            <DeltaBadge d={thisMonth?.diff ?? null} />
            <span className="ms-1.5 text-[11px] text-zinc-500">מול חודש קודם</span>
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
              <div className="flex items-center gap-2">
                <DeltaBadge d={tr.perWeek} digits={2} suffix="ק״ג/שבוע" />
              </div>
              <p className="mt-1.5 text-sm text-zinc-300">
                קצב של <b>{trendText.text}</b> בשבוע · סה״כ{' '}
                <b>{describeDelta(tr.total).text}</b> ב-{tr.spanDays} הימים האחרונים
              </p>
            </div>
          ) : (
            <p className="mb-3 text-sm text-zinc-500">צריך לפחות 3 שקילות על פני שבוע כדי לחשב קצב.</p>
          )}
          <WeightChart weights={weights} days={range} />
          <p className="mt-1 text-center text-[11px] text-zinc-500">קו ירוק: ממוצע נע של 7 ימים · נקודות: שקילות יומיות</p>
        </div>

        <Segmented
          value={tab}
          onChange={setTab}
          options={[{ value: 'daily', label: 'יומי' }, { value: 'weekly', label: 'שבועי' }, { value: 'monthly', label: 'חודשי' }]}
        />

        <ul className="card divide-y divide-white/5">
          {tab === 'daily' &&
            daily.map((w, i) => (
              <li key={w.date} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm">{longDate(w.date)}</div>
                </div>
                <DeltaBadge d={daily[i + 1] ? w.kg - daily[i + 1].kg : null} suffix="" />
                <span className="tabular w-14 text-start font-semibold">{fmtKg(w.kg)}</span>
                <button className="text-zinc-500 active:text-rose-300" onClick={() => setToDelete(w.date)} aria-label="מחק">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          {tab === 'weekly' &&
            weekly.map((w) => (
              <li key={w.weekStart} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">שבוע <span dir="ltr">{shortDate(w.weekStart)}–{shortDate(w.weekEnd)}</span></div>
                  <div className="text-xs text-zinc-500">{w.count} שקילות · טווח {fmtKg(w.min)}–{fmtKg(w.max)}</div>
                </div>
                <DeltaBadge d={w.diff} suffix="" />
                <span className="tabular w-14 text-start font-semibold">{fmtKg(w.avg, 2)}</span>
              </li>
            ))}
          {tab === 'monthly' &&
            monthly.map((m) => (
              <li key={m.month} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium">{monthLabel(m.month)}</div>
                  <div className="text-xs text-zinc-500">
                    {m.count} שקילות{m.diff != null && ` · ${describeDelta(m.diff, 2).text}`}
                  </div>
                </div>
                <DeltaBadge d={m.diff} suffix="" />
                <span className="tabular w-14 text-start font-semibold">{fmtKg(m.avg, 2)}</span>
              </li>
            ))}
        </ul>
      </div>

      <ConfirmSheet
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="למחוק את השקילה?"
        message={toDelete && longDate(toDelete)}
        confirmText="מחק"
        danger
        onConfirm={() => deleteWeight(toDelete)}
      />
    </>
  )
}
