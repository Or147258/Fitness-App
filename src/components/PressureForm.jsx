import React, { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { pad, toKey } from '../lib/date'
import { toast } from './ui'

const nowTime = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fmtBP = (x) => `${x.sys}/${x.dia}`

/** טופס לחץ דם. reading=null → חדש; compact → בלי תאריך/שעה/הערה */
export function PressureForm({ reading = null, compact = false, onDone }) {
  const { addPressure, updatePressure } = useStore.getState()
  const [sys, setSys] = useState('')
  const [dia, setDia] = useState('')
  const [pulse, setPulse] = useState('')
  const [date, setDate] = useState(toKey())
  const [time, setTime] = useState(nowTime)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!reading) return
    setSys(String(reading.sys))
    setDia(String(reading.dia))
    setPulse(reading.pulse == null ? '' : String(reading.pulse))
    setDate(reading.date)
    setTime(reading.time)
    setNote(reading.note ?? '')
  }, [reading])

  const submit = (e) => {
    e.preventDefault()
    const s = parseInt(sys, 10)
    const d = parseInt(dia, 10)
    const p = pulse === '' ? null : parseInt(pulse, 10)
    if (!(s >= 50 && s <= 260) || !(d >= 30 && d <= 160)) return toast('הזן לחץ דם תקין (עליון / תחתון)')
    if (d >= s) return toast('הלחץ העליון צריך להיות גבוה מהתחתון')
    if (p != null && !(p >= 30 && p <= 220)) return toast('הזן דופק תקין')
    const data = { sys: s, dia: d, pulse: p, date, time: time || nowTime(), note: note.trim() }
    if (reading) {
      updatePressure(reading.id, data)
      toast('המדידה עודכנה')
    } else {
      addPressure(compact ? { ...data, date: toKey(), time: nowTime() } : data)
      toast('המדידה נשמרה ✓')
      setSys('')
      setDia('')
      setPulse('')
      setNote('')
      setTime(nowTime())
    }
    onDone?.()
  }

  const field = 'input tabular h-12 px-2 text-center text-lg font-semibold'
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="grid flex-1 grid-cols-3 gap-2">
          <label>
            <span className="label">עליון</span>
            <input className={field} inputMode="numeric" placeholder="120" aria-label="לחץ עליון" value={sys} onChange={(e) => setSys(e.target.value)} />
          </label>
          <label>
            <span className="label">תחתון</span>
            <input className={field} inputMode="numeric" placeholder="80" aria-label="לחץ תחתון" value={dia} onChange={(e) => setDia(e.target.value)} />
          </label>
          <label>
            <span className="label">דופק</span>
            <input className={field} inputMode="numeric" placeholder="—" aria-label="דופק" value={pulse} onChange={(e) => setPulse(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn h-12 bg-sky-400 px-4 text-ink-950 shadow-[0_8px_24px_-8px_rgba(56,189,248,.55)]">
          {reading ? 'עדכן' : 'שמור'}
        </button>
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
            <input className="input text-sm" placeholder="למשל: יד שמאל, אחרי מנוחה" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </>
      )}
    </form>
  )
}
