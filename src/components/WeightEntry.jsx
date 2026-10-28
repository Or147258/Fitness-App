import React from 'react'
import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { toKey } from '../lib/date'
import { deltaTone } from '../lib/weightStats'
import { toast } from './ui'

/** טופס הזנת משקל יומי (ברירת מחדל: היום). אותו תאריך = עדכון */
export function WeightEntry({ showDate = true }) {
  const weights = useStore((s) => s.weights)
  const saveWeight = useStore((s) => s.saveWeight)
  const [date, setDate] = useState(toKey())
  const existing = weights.find((w) => w.date === date)
  const [kg, setKg] = useState(existing ? String(existing.kg) : '')

  useEffect(() => { setKg(existing ? String(existing.kg) : '') }, [date, existing?.kg]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault()
    const n = parseFloat(kg.replace(',', '.'))
    if (!(n > 20 && n < 400)) return toast('הזן משקל תקין בק״ג')
    saveWeight(date, Math.round(n * 10) / 10)
    toast(existing ? 'המשקל עודכן' : 'המשקל נשמר ✓')
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      {showDate && (
        <div className="w-[8.5rem] shrink-0">
          <label className="label">תאריך</label>
          <input type="date" className="input px-3 text-sm" value={date} max={toKey()} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </div>
      )}
      <div className="flex-1">
        <label className="label">משקל (ק״ג)</label>
        <input
          className="input tabular text-center text-lg font-semibold"
          inputMode="decimal"
          placeholder="0.0"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary px-4">{existing ? 'עדכן' : 'שמור'}</button>
    </form>
  )
}

const TONES = {
  good: 'bg-emerald-400/15 text-emerald-300',
  bad: 'bg-rose-400/15 text-rose-300',
  neutral: 'bg-white/[0.06] text-zinc-300',
}

/** תגית הפרש: חץ + ק״ג, צבע לפי מטרה (חיטוב/מסה/שמירה) */
export function DeltaBadge({ d, digits = 1, suffix = 'ק״ג', className = '' }) {
  const goal = useStore((s) => s.settings.weightGoal)
  if (d == null) return <span className={`text-xs text-zinc-500 ${className}`}>—</span>
  const dir = Math.abs(d) < 0.05 ? 'flat' : d < 0 ? 'down' : 'up'
  const Icon = dir === 'flat' ? Minus : dir === 'down' ? ArrowDownRight : ArrowUpRight
  return (
    <span className={`tabular inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-semibold ${TONES[deltaTone(dir, goal)]} ${className}`}>
      <Icon size={13} />
      <span dir="ltr">{dir === 'flat' ? '0' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(digits)}`}</span>
      {suffix && <span className="font-normal opacity-80">{suffix}</span>}
    </span>
  )
}
