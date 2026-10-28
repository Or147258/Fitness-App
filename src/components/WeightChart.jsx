import React from 'react'
import { useMemo } from 'react'
import { addDays, fromKey, shortDate, toKey } from '../lib/date'
import { rollingAverage } from '../lib/weightStats'

/** גרף משקל: נקודות יומיות + קו ממוצע נע 7 ימים. ציר הזמן משמאל לימין כמקובל בגרפים */
export function WeightChart({ weights, days = 30, color = '#a3e635', digits = 1, minPad = 0.5, emptyText = 'צריך לפחות שתי שקילות בטווח כדי להציג גרף', label = 'גרף משקל' }) {
  const gid = `fill-${color.slice(1)}`
  const W = 340
  const H = 170
  const P = { t: 12, r: 10, b: 22, l: 34 }

  const data = useMemo(() => {
    const today = toKey()
    const from = toKey(addDays(fromKey(today), -(days - 1)))
    const inRange = weights.filter((w) => w.date >= from && w.date <= today)
    const rolling = rollingAverage(weights).filter((w) => w.date >= from && w.date <= today)
    return { from, today, inRange, rolling }
  }, [weights, days])

  if (data.inRange.length < 2) {
    return (
      <div className="grid h-[170px] place-items-center text-sm text-zinc-500">
        {emptyText}
      </div>
    )
  }

  const values = data.inRange.map((w) => w.kg)
  let min = Math.min(...values)
  let max = Math.max(...values)
  const pad = Math.max(minPad, (max - min) * 0.15)
  min -= pad
  max += pad
  const t0 = fromKey(data.from).getTime()
  const span = fromKey(data.today).getTime() - t0 || 1
  const x = (k) => P.l + ((fromKey(k).getTime() - t0) / span) * (W - P.l - P.r)
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const ticks = [max - pad, (max + min) / 2, min + pad]
  const linePath = data.rolling.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${x(data.rolling.at(-1).date)},${H - P.b} L${x(data.rolling[0].date)},${H - P.b} Z`
  const xLabels = [data.from, toKey(addDays(fromKey(data.from), Math.floor(days / 2))), data.today]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" dir="ltr" style={{ direction: 'ltr' }} role="img" aria-label={label}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="white" strokeOpacity="0.06" />
          <text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="fill-zinc-500 text-[10px]">{t.toFixed(digits)}</text>
        </g>
      ))}
      {xLabels.map((k, i) => (
        <text key={k} x={x(k)} y={H - 6} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'} className="fill-zinc-500 text-[10px]">
          {shortDate(k)}
        </text>
      ))}
      <path d={areaPath} fill={`url(#${gid})`} />
      {data.inRange.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.kg)} r="2.6" className="fill-zinc-400/70" />
      ))}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.rolling.at(-1).date)} cy={y(data.rolling.at(-1).kg)} r="4.5" fill={color} stroke="#121418" strokeWidth="2" />
    </svg>
  )
}
