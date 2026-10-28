import React from 'react'
import { addDays, fromKey, shortDate, toKey } from '../lib/date'

const THEMES = {
  dark: { grid: 'rgba(255,255,255,.07)', text: '#71717a', ring: '#121418' },
  light: { grid: '#e4e4e7', text: '#52525b', ring: '#ffffff' },
}

/**
 * גרף קווים כללי לפי תאריכים.
 * series: [{ label, color, points: [{ date: 'YYYY-MM-DD', v }], dots?: true, width?: 2.5, dashed?: false }]
 * days → חלון של N הימים האחרונים; בלי days → מהתאריך הראשון לאחרון בנתונים (או from/to).
 */
export function LineChart({
  series,
  days,
  from: fromProp,
  to: toProp,
  digits = 0,
  minPad = 1,
  height = 170,
  theme = 'dark',
  emptyText = 'אין מספיק נתונים להצגת גרף',
  label = 'גרף',
  legend = true,
}) {
  const t = THEMES[theme]
  const W = 340
  const H = height
  const P = { t: 12, r: 12, b: 22, l: 34 }

  const today = toKey()
  const all = series.flatMap((s) => s.points)
  let from = fromProp ?? (days ? toKey(addDays(fromKey(today), -(days - 1))) : all.reduce((m, p) => (p.date < m ? p.date : m), all[0]?.date ?? today))
  let to = toProp ?? (days ? today : all.reduce((m, p) => (p.date > m ? p.date : m), all[0]?.date ?? today))
  if (from === to) from = toKey(addDays(fromKey(to), -1))

  const visible = series.map((s) => ({ ...s, points: s.points.filter((p) => p.date >= from && p.date <= to).sort((a, b) => a.date.localeCompare(b.date)) }))
  const values = visible.flatMap((s) => s.points.map((p) => p.v))
  if (values.length < 2) {
    return <div className="grid place-items-center text-sm text-zinc-500" style={{ height: H }}>{emptyText}</div>
  }

  let min = Math.min(...values)
  let max = Math.max(...values)
  const pad = Math.max(minPad, (max - min) * 0.15)
  min -= pad
  max += pad
  const t0 = fromKey(from).getTime()
  const span = fromKey(to).getTime() - t0 || 1
  const x = (k) => P.l + ((fromKey(k).getTime() - t0) / span) * (W - P.l - P.r)
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b)
  const ticks = [max - pad, (max + min) / 2, min + pad]
  const mid = toKey(new Date((t0 + fromKey(to).getTime()) / 2))
  const xLabels = [[from, 'start'], [mid, 'middle'], [to, 'end']]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" dir="ltr" style={{ direction: 'ltr' }} role="img" aria-label={label}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke={t.grid} />
            <text x={P.l - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill={t.text}>{v.toFixed(digits)}</text>
          </g>
        ))}
        {xLabels.map(([k, anchor]) => (
          <text key={anchor} x={x(k)} y={H - 6} textAnchor={anchor} fontSize="10" fill={t.text}>{shortDate(k)}</text>
        ))}
        {visible.map((s) => {
          if (!s.points.length) return null
          const d = s.points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
          const last = s.points[s.points.length - 1]
          return (
            <g key={s.label}>
              {s.points.length > 1 && (
                <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
              )}
              {(s.dots ?? true) && s.points.map((p) => <circle key={p.date + p.v} cx={x(p.date)} cy={y(p.v)} r="2.6" fill={s.color} opacity=".75" />)}
              <circle cx={x(last.date)} cy={y(last.v)} r="4.2" fill={s.color} stroke={t.ring} strokeWidth="2" />
            </g>
          )
        })}
      </svg>
      {legend && series.length > 1 && (
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px]" style={{ color: t.text }}>
          {series.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
