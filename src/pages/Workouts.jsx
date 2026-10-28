import React from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Dumbbell, Pencil, Play, Plus } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PROGRAM_PRESETS, muscleById } from '../data/exercises'
import { PageHeader, Sheet, Stepper, Empty, toast } from '../components/ui'
import { relativeDay } from '../lib/date'
import { programColor } from '../lib/colors'

const STYLES = [
  { id: 'letters', label: 'אותיות', example: 'אימון A, B, C…', fixed: false },
  { id: 'ppl', label: 'Push / Pull / Legs', example: '3 אימונים', fixed: true },
  { id: 'upperLower', label: 'Upper / Lower', example: '4 אימונים', fixed: true },
  { id: 'fullBody', label: 'פול באדי', example: 'פול באדי 1, 2…', fixed: false },
]

/** יצירת סט אימונים מהיר: בוחרים כמות וסגנון שמות, ואפשר לערוך כל שם */
function SetupSheet({ open, onClose }) {
  const createPrograms = useStore((s) => s.createPrograms)
  const [count, setCount] = useState(4)
  const [style, setStyle] = useState('letters')
  const [names, setNames] = useState(null)

  const generated = PROGRAM_PRESETS[style](count)
  const current = names ?? generated
  const fixed = STYLES.find((s) => s.id === style).fixed

  const create = () => {
    const list = current.map((n) => n.trim()).filter(Boolean)
    if (!list.length) return
    createPrograms(list)
    toast(`נוצרו ${list.length} אימונים`)
    setNames(null)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="הגדרת אימונים" footer={<button className="btn-primary w-full" onClick={create}>צור {current.length} אימונים</button>}>
      <label className="label">סגנון שמות</label>
      <div className="grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => { setStyle(s.id); setNames(null) }}
            className={`rounded-xl p-3 text-start transition ${style === s.id ? 'bg-lime-400/10 ring-1 ring-lime-400/50' : 'bg-white/[0.04]'}`}
          >
            <div className="text-sm font-semibold">{s.label}</div>
            <div className="text-xs text-zinc-500">{s.example}</div>
          </button>
        ))}
      </div>

      {!fixed && (
        <div className="mt-4">
          <label className="label">כמה אימונים?</label>
          <Stepper value={count} min={1} max={7} onChange={(v) => { setCount(v); setNames(null) }} />
        </div>
      )}

      <label className="label mt-4">שמות (אפשר לערוך)</label>
      <div className="space-y-2">
        {current.map((n, i) => (
          <input
            key={`${style}-${i}`}
            className="input"
            value={n}
            onChange={(e) => setNames(current.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
      </div>
    </Sheet>
  )
}

function NewProgramSheet({ open, onClose }) {
  const createPrograms = useStore((s) => s.createPrograms)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const create = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const [id] = createPrograms([name.trim()])
    setName('')
    onClose()
    navigate(`/workouts/${id}`)
  }
  return (
    <Sheet open={open} onClose={onClose} title="אימון חדש">
      <form onSubmit={create} className="space-y-4">
        <div>
          <label className="label">שם האימון</label>
          <input className="input" autoFocus placeholder="למשל: אימון E או Arms Day" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={!name.trim()}>צור והוסף תרגילים</button>
      </form>
    </Sheet>
  )
}

export default function Workouts() {
  const programs = useStore((s) => s.programs)
  const sessions = useStore((s) => s.sessions)
  const exercises = useStore((s) => s.exercises)
  const active = useStore((s) => s.active)
  const { startWorkout, moveProgram } = useStore.getState()
  const navigate = useNavigate()
  const [setupOpen, setSetupOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const lastDone = useMemo(() => {
    const map = {}
    for (const s of sessions) if (s.programId && (!map[s.programId] || s.date > map[s.programId])) map[s.programId] = s.date
    return map
  }, [sessions])

  const start = (id) => {
    if (active) return navigate('/active')
    startWorkout(id)
    navigate('/active')
  }

  return (
    <>
      <PageHeader
        title="תוכנית האימונים"
        subtitle={programs.length ? `${programs.length} אימונים` : undefined}
        action={
          programs.length > 0 && (
            <button className="btn-primary h-10 px-3 text-sm" onClick={() => setNewOpen(true)}>
              <Plus size={18} /> אימון
            </button>
          )
        }
      />
      <div className="space-y-3 px-4">
        {!programs.length && (
          <Empty icon={Dumbbell} title="בוא נבנה את התוכנית שלך" text="בחר כמה אימונים יש לך בשבוע ואיך לקרוא להם (A/B/C/D, Push/Pull/Legs וכו׳). אחר כך מוסיפים לכל אימון תרגילים מהמאגר.">
            <button className="btn-primary w-full" onClick={() => setSetupOpen(true)}>הגדרת אימונים</button>
          </Empty>
        )}

        {programs.map((p, i) => {
          const color = programColor(programs, p.id)
          const muscles = [...new Set(p.exercises.map((x) => exercises.find((e) => e.id === x.exerciseId)?.muscle).filter(Boolean))]
          return (
            <article key={p.id} className="card overflow-hidden">
              <div className="flex">
                <div className={`w-1.5 ${color.bar}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold">{p.name}</h2>
                      <p className="text-xs text-zinc-400">
                        {p.exercises.length} תרגילים
                        {lastDone[p.id] && ` · בוצע ${relativeDay(lastDone[p.id])}`}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <button className="p-1 text-zinc-500 disabled:opacity-20" disabled={i === 0} onClick={() => moveProgram(p.id, -1)} aria-label="הזז למעלה"><ChevronUp size={18} /></button>
                      <button className="p-1 text-zinc-500 disabled:opacity-20" disabled={i === programs.length - 1} onClick={() => moveProgram(p.id, 1)} aria-label="הזז למטה"><ChevronDown size={18} /></button>
                    </div>
                  </div>
                  {muscles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {muscles.map((m) => (
                        <span key={m} className={`rounded-md px-1.5 py-0.5 text-[11px] ${muscleById(m).chip}`}>{muscleById(m).name}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button className="btn-primary h-11" onClick={() => start(p.id)} disabled={!p.exercises.length}>
                      <Play size={18} className="fill-current" /> התחל אימון
                    </button>
                    <Link to={`/workouts/${p.id}`} className="btn-ghost h-11">
                      <Pencil size={16} /> {p.exercises.length ? 'עריכה' : 'הוסף תרגילים'}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}

        {programs.length > 0 && (
          <button className="btn-ghost w-full text-zinc-400" onClick={() => start(null)}>
            <Play size={16} /> אימון חופשי (בלי תוכנית)
          </button>
        )}
      </div>

      <SetupSheet open={setupOpen} onClose={() => setSetupOpen(false)} />
      <NewProgramSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </>
  )
}
