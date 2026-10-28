import React, { useEffect, useState } from 'react'
import { GLUCOSE_CONTEXTS, useStore } from '../store/useStore'
import { pad, toKey } from '../lib/date'
import { toast } from './ui'

export const contextLabel = (id) => GLUCOSE_CONTEXTS.find((c) => c.id === id)?.label ?? 'אחר'

const nowTime = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
// ברירת מחדל חכמה: מדידה בבוקר המוקדם היא בדרך כלל בצום
const defaultContext = () => (new Date().getHours() < 10 ? 'fasting' : 'other')

export function ContextChips({ value, onChange, small = false }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {GLUCOSE_CONTEXTS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          aria-pressed={value === c.id}
          className={`${small ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-sm'} rounded-full font-medium transition ${
            value === c.id ? 'bg-orange-400 text-ink-950' : 'bg-white/[0.06] text-zinc-300'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

/**
 * טופס מדידת סוכר. reading=null → מדידה חדשה, אחרת עריכה.
 * compact → בלי תאריך/שעה/הערה (לדף הבית)
 */
export function GlucoseForm({ reading = null, compact = false, onDone }) {
  const { addGlucose, updateGlucose } = useStore.getState()
  const [value, setValue] = useState('')
  const [context, setContext] = useState(defaultContext)
  const [date, setDate] = useState(toKey())
  const [time, setTime] = useState(nowTime)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!reading) return
    setValue(String(reading.value))
    setContext(reading.context)
    setDate(reading.date)
    setTime(reading.time)
    setNote(reading.note ?? '')
  }, [reading])

  const submit = (e) => {
    e.preventDefault()
    const n = Math.round(parseFloat(value.replace(',', '.')))
    if (!(n >= 20 && n <= 600)) return toast('הזן ערך סוכר תקין (mg/dL)')
    const data = { value: n, context, date, time: time || nowTime(), note: note.trim() }
    if (reading) {
      updateGlucose(reading.id, data)
      toast('המדידה עודכנה')
    } else {
      addGlucose(compact ? { ...data, date: toKey(), time: nowTime() } : data)
      toast('המדידה נשמרה ✓')
      setValue('')
      setNote('')
      setTime(nowTime())
    }
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="label">רמת סוכר (mg/dL)</label>
          <input
            className="input tabular text-center text-lg font-semibold"
            inputMode="numeric"
            placeholder="0"
            aria-label="רמת סוכר"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button type="submit" className="btn h-12 bg-orange-400 px-5 text-ink-950 shadow-[0_8px_24px_-8px_rgba(251,146,60,.55)]">
          {reading ? 'עדכן' : 'שמור'}
        </button>
      </div>

      <div>
        <label className="label">מתי נמדד?</label>
        <ContextChips value={context} onChange={setContext} small={compact} />
      </div>

      {!compact && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">תאריך</label>
              <input type="date" className="input px-3 text-sm" value={date} max={toKey()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">שעה</label>
              <input type="time" className="input px-3 text-sm" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">הערה (לא חובה)</label>
            <input className="input text-sm" placeholder="למשל: אחרי ארוחת צהריים כבדה" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </>
      )}
    </form>
  )
}
