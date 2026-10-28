import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Check, Plus, Search } from 'lucide-react'
import { useStore } from '../store/useStore'
import { MUSCLES, muscleById } from '../data/exercises'
import { Sheet, toast } from './ui'
import { MuscleChips } from './MuscleChips'
import { ExerciseThumb } from './ExerciseMedia'

export function filterExercises(exercises, q, muscle) {
  const query = q.trim().toLowerCase()
  return exercises.filter(
    (e) => (muscle === 'all' || e.muscle === muscle) && (!query || e.name.toLowerCase().includes(query)),
  )
}

/** בחירת תרגילים מהמאגר (בחירה מרובה, שומר על סדר הבחירה) */
export function ExercisePicker({ open, onClose, onPick, title = 'הוספת תרגילים' }) {
  const exercises = useStore((s) => s.exercises)
  const addExercise = useStore((s) => s.addExercise)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('all')
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (open) { setSelected([]); setQ('') }
  }, [open])

  const list = useMemo(() => filterExercises(exercises, q, muscle), [exercises, q, muscle])
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const createFromSearch = () => {
    if (muscle === 'all') return toast('בחר קבוצת שריר כדי ליצור תרגיל חדש')
    const id = addExercise({ name: q.trim(), muscle })
    setSelected((s) => [...s, id])
    setQ('')
    toast('התרגיל נוסף למאגר')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <button className="btn-primary w-full" disabled={!selected.length} onClick={() => { onPick(selected); onClose() }}>
          {selected.length ? `הוסף ${selected.length} תרגילים` : 'בחר תרגילים'}
        </button>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 space-y-2 bg-ink-900 px-5 pb-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input className="input ps-10" placeholder="חיפוש תרגיל..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <MuscleChips value={muscle} onChange={setMuscle} />
      </div>

      <ul className="space-y-1.5">
        {list.map((e) => {
          const order = selected.indexOf(e.id)
          const on = order >= 0
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => toggle(e.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-2 text-start transition ${on ? 'bg-lime-400/10 ring-1 ring-lime-400/40' : 'active:bg-white/5'}`}
              >
                <ExerciseThumb exercise={e} size="size-11" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-zinc-500">{muscleById(e.muscle).name}</div>
                </div>
                <span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${on ? 'bg-lime-400 text-ink-950' : 'border border-white/15'}`}>
                  {on ? order + 1 : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {q.trim() && (
        <button className="btn-ghost mt-3 w-full" onClick={createFromSearch}>
          <Plus size={18} /> צור תרגיל חדש: "{q.trim()}"
          {muscle !== 'all' && <span className="text-zinc-400">({MUSCLES.find((m) => m.id === muscle)?.name})</span>}
        </button>
      )}
      {!list.length && !q && <p className="py-8 text-center text-sm text-zinc-500">אין תרגילים בקבוצה הזו</p>}
      {selected.length > 0 && (
        <p className="mt-3 flex items-center justify-center gap-1 text-xs text-zinc-500">
          <Check size={14} /> התרגילים יתווספו לפי סדר הבחירה
        </p>
      )}
    </Sheet>
  )
}
