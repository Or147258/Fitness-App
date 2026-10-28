import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Clock, Flame, Minus, MoreVertical, Plus, SkipForward, Timer, Trophy, X } from 'lucide-react'
import { useExerciseMap, useStore } from '../store/useStore'
import { useNow } from '../hooks/useNow'
import { useWakeLock } from '../hooks/useWakeLock'
import { fmtClock, fmtDuration } from '../lib/date'
import { computePRs, fmtPR, fmtSet, isBetter } from '../lib/prs'
import { beep, primeAudio, vibrate } from '../lib/feedback'
import { ConfirmSheet, Sheet, Stepper, toast } from '../components/ui'
import { ExerciseMedia, ExerciseThumb } from '../components/ExerciseMedia'
import { ExercisePicker } from '../components/ExercisePicker'
import { MuscleTag } from '../components/MuscleChips'

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/* ---------- טיימר מנוחה צף ---------- */
function RestTimer() {
  const rest = useStore((s) => s.active?.rest)
  const settings = useStore((s) => s.settings)
  const { adjustRest, clearRest } = useStore.getState()
  const now = useNow(250, !!rest)
  const alerted = useRef(null)

  const remaining = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0
  const finished = !!rest && remaining <= 0

  useEffect(() => {
    if (!finished || alerted.current === rest.endsAt) return
    alerted.current = rest.endsAt
    if (settings.sound) beep()
    if (settings.vibrate) vibrate()
    const t = setTimeout(clearRest, 4000)
    return () => clearTimeout(t)
  }, [finished, rest, settings, clearRest])

  if (!rest) return null
  const progress = Math.min(1, remaining / rest.duration)

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md animate-pop">
      <div className={`overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${finished ? 'border-lime-400/60 bg-lime-400 text-ink-950' : 'border-white/10 bg-ink-700/95'}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <Timer size={22} className={finished ? '' : 'text-lime-300'} />
          <div className="flex-1">
            <div className={`text-xs ${finished ? 'font-semibold' : 'text-zinc-400'}`}>{finished ? 'המנוחה הסתיימה!' : 'מנוחה'}</div>
            <div className="tabular text-2xl font-bold leading-none">{finished ? 'לסט הבא 💪' : fmtClock(Math.ceil(remaining))}</div>
          </div>
          {!finished && (
            <>
              <button className="btn h-10 rounded-full bg-white/10 px-3 text-sm" onClick={() => adjustRest(-15)}>‎−15</button>
              <button className="btn h-10 rounded-full bg-white/10 px-3 text-sm" onClick={() => adjustRest(15)}>‎+15</button>
            </>
          )}
          <button className={`btn size-10 rounded-full ${finished ? 'bg-ink-950/15' : 'bg-white/10'}`} onClick={clearRest} aria-label="דלג">
            {finished ? <X size={18} /> : <SkipForward size={18} />}
          </button>
        </div>
        {!finished && (
          <div className="h-1 bg-white/5">
            <div className="h-full bg-lime-400 transition-[width] duration-200 ease-linear" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- כרטיס תרגיל באימון ---------- */
function ExerciseCard({ ex, index, total, exercise, pr }) {
  const { updateSet, toggleSet, addSet, removeLastSet, removeActiveExercise, moveActiveExercise, setActiveExerciseRest } = useStore.getState()
  const defaultRest = useStore((s) => s.settings.restSec)
  const [menu, setMenu] = useState(false)
  const [media, setMedia] = useState(false)
  const [shake, setShake] = useState(null)
  const doneCount = ex.sets.filter((s) => s.done).length

  const onToggle = (si) => {
    primeAudio() // מאפשר צליל בסיום המנוחה (iOS)
    if (!toggleSet(index, si)) {
      setShake(si)
      setTimeout(() => setShake(null), 600)
      toast('הזן מספר חזרות')
    }
  }

  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 p-3 pb-2">
        <button onClick={() => setMedia(true)} aria-label="הדגמה">
          <ExerciseThumb exercise={exercise} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold">{exercise?.name ?? 'תרגיל'}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 px-1.5 py-0.5 font-medium text-amber-300">
              <Trophy size={12} /> שיא: {fmtPR(pr)}
            </span>
            {ex.targetReps && <span className="text-zinc-500">יעד {ex.targetReps}</span>}
          </div>
        </div>
        <span className="tabular text-xs text-zinc-500">{doneCount}/{ex.sets.length}</span>
        <button className="btn-icon size-9 rounded-full" onClick={() => setMenu(true)} aria-label="אפשרויות">
          <MoreVertical size={18} />
        </button>
      </header>

      <div className="px-3 pb-3">
        <div className="grid grid-cols-[1.75rem_1fr_4.25rem_4.25rem_2.75rem] items-center gap-2 px-1 pb-1.5 text-[11px] font-medium text-zinc-500">
          <span className="text-center">סט</span>
          <span className="text-center">קודם</span>
          <span className="text-center">ק״ג</span>
          <span className="text-center">חזרות</span>
          <span className="text-center">✓</span>
        </div>
        <div className="space-y-1.5">
          {ex.sets.map((st, si) => {
            const isPR = st.done && isBetter({ weight: num(st.weight), reps: num(st.reps) }, pr)
            return (
              <div
                key={st.uid}
                className={`grid grid-cols-[1.75rem_1fr_4.25rem_4.25rem_2.75rem] items-center gap-2 rounded-xl px-1 py-1 transition ${st.done ? 'bg-lime-400/10' : ''} ${shake === si ? 'animate-shake' : ''}`}
              >
                <span className="grid place-items-center text-sm font-bold text-zinc-400">
                  {isPR ? <Trophy size={15} className="text-amber-300" /> : si + 1}
                </span>
                <span className="tabular truncate text-center text-xs text-zinc-500" dir="ltr">
                  {st.prevReps != null ? fmtSet({ weight: st.prevWeight, reps: st.prevReps }) : '—'}
                </span>
                <input
                  className={`tabular h-10 w-full rounded-lg border text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-lime-400/30 ${st.done ? 'border-transparent bg-transparent' : 'border-white/10 bg-ink-800'}`}
                  inputMode="decimal"
                  placeholder={st.prevWeight != null ? String(st.prevWeight) : '0'}
                  value={st.weight}
                  onChange={(e) => updateSet(index, si, { weight: e.target.value })}
                />
                <input
                  className={`tabular h-10 w-full rounded-lg border text-center text-base font-semibold focus:outline-none focus:ring-2 focus:ring-lime-400/30 ${st.done ? 'border-transparent bg-transparent' : 'border-white/10 bg-ink-800'}`}
                  inputMode="numeric"
                  placeholder={st.prevReps != null ? String(st.prevReps) : ex.targetReps || '0'}
                  value={st.reps}
                  onChange={(e) => updateSet(index, si, { reps: e.target.value })}
                />
                <button
                  onClick={() => onToggle(si)}
                  aria-label={st.done ? 'בטל סימון' : 'סמן סט כהושלם'}
                  aria-pressed={st.done}
                  className={`grid size-10 place-items-center rounded-lg transition active:scale-90 ${st.done ? 'bg-lime-400 text-ink-950' : 'bg-ink-700 text-zinc-500'}`}
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            )
          })}
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <button className="btn h-10 bg-white/[0.05] text-sm text-zinc-300" onClick={() => addSet(index)}>
            <Plus size={16} /> הוסף סט
          </button>
          <button className="btn h-10 w-12 bg-white/[0.05] text-zinc-400 disabled:opacity-30" disabled={ex.sets.length <= 1} onClick={() => removeLastSet(index)} aria-label="הסר סט אחרון">
            <Minus size={16} />
          </button>
        </div>
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={exercise?.name ?? ''}>
        <label className="label">זמן מנוחה לתרגיל הזה</label>
        <Stepper value={ex.restSec ?? defaultRest} min={0} max={600} step={15} format={fmtClock} onChange={(v) => setActiveExerciseRest(index, v)} />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="btn-ghost" disabled={index === 0} onClick={() => { moveActiveExercise(index, -1); setMenu(false) }}>הזז למעלה</button>
          <button className="btn-ghost" disabled={index === total - 1} onClick={() => { moveActiveExercise(index, 1); setMenu(false) }}>הזז למטה</button>
        </div>
        <button className="btn-danger mt-2 w-full" onClick={() => { removeActiveExercise(index); setMenu(false) }}>הסר מהאימון</button>
      </Sheet>

      <Sheet open={media} onClose={() => setMedia(false)} title={exercise?.name ?? ''}>
        <ExerciseMedia exercise={exercise} />
        {exercise?.notes && <p className="mt-3 rounded-xl bg-ink-800 p-3 text-sm text-zinc-300">{exercise.notes}</p>}
        <div className="mt-3"><MuscleTag muscle={exercise?.muscle} /></div>
      </Sheet>
    </article>
  )
}

/* ---------- סיכום אחרי שמירה ---------- */
function Summary({ result, exMap }) {
  const { session, newPRs } = result
  const navigate = useNavigate()
  const sets = session.exercises.reduce((n, e) => n + e.sets.length, 0)
  const volume = session.exercises.reduce((v, e) => v + e.sets.reduce((s, x) => s + x.weight * x.reps, 0), 0)
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-safe pt-safe">
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="mb-5 grid size-20 animate-pop place-items-center rounded-3xl bg-lime-400 text-ink-950">
          <Flame size={40} />
        </div>
        <h1 className="text-2xl font-extrabold">כל הכבוד!</h1>
        <p className="mt-1 text-zinc-400">{session.programName} נשמר ביומן</p>
        <div className="mt-6 grid w-full grid-cols-3 gap-2">
          {[
            ['זמן', fmtDuration(session.durationSec)],
            ['סטים', sets],
            ['נפח', `${Math.round(volume).toLocaleString('he-IL')} ק״ג`],
          ].map(([l, v]) => (
            <div key={l} className="card p-3">
              <div className="text-xs text-zinc-500">{l}</div>
              <div className="tabular mt-1 font-bold">{v}</div>
            </div>
          ))}
        </div>
        {newPRs.length > 0 && (
          <div className="mt-4 w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-start">
            <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-200"><Trophy size={18} /> שיאים חדשים!</h2>
            <ul className="space-y-1.5 text-sm">
              {newPRs.map((p) => (
                <li key={p.exerciseId} className="flex justify-between gap-3">
                  <span className="truncate">{exMap[p.exerciseId]?.name}</span>
                  <span className="tabular shrink-0 font-semibold text-amber-200">
                    {fmtPR(p.best)} {p.prev && <span className="font-normal text-amber-200/50">(היה {fmtPR(p.prev)})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="grid gap-2 pb-4">
        <button className="btn-primary" onClick={() => navigate('/', { replace: true })}>לדף הבית</button>
        <button className="btn-ghost" onClick={() => navigate('/calendar', { replace: true })}>צפה ביומן</button>
      </div>
    </div>
  )
}

/* ---------- המסך הראשי ---------- */
function ActiveView() {
  const active = useStore((s) => s.active)
  const sessions = useStore((s) => s.sessions)
  const { finishWorkout, cancelWorkout, addExercisesToActive } = useStore.getState()
  const exMap = useExerciseMap()
  const navigate = useNavigate()
  const now = useNow(1000)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  useWakeLock(true)

  const prs = useMemo(() => computePRs(sessions), [sessions])
  const allSets = active.exercises.flatMap((e) => e.sets)
  const done = allSets.filter((s) => s.done)
  const undone = allSets.length - done.length
  const volume = done.reduce((v, s) => v + num(s.weight) * num(s.reps), 0)

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-32">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-ink-950/90 pt-safe backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link to="/" className="btn-icon rounded-full" aria-label="מזער (האימון ממשיך)"><ChevronDown size={20} /></Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-zinc-400">{active.programName}</div>
            <div className="tabular text-2xl font-bold leading-none text-lime-300">{fmtClock((now - active.startedAt) / 1000)}</div>
          </div>
          <button className="btn-primary h-10 px-5" onClick={() => setFinishOpen(true)}>סיום</button>
        </div>
        <div className="h-1 bg-white/5">
          <div className="h-full bg-lime-400 transition-all" style={{ width: `${allSets.length ? (done.length / allSets.length) * 100 : 0}%` }} />
        </div>
      </header>

      <div className="space-y-3 p-4">
        {active.exercises.map((ex, i) => (
          <ExerciseCard key={ex.uid} ex={ex} index={i} total={active.exercises.length} exercise={exMap[ex.exerciseId]} pr={prs[ex.exerciseId]} />
        ))}

        <button className="btn-ghost h-12 w-full border border-dashed border-white/15" onClick={() => setPickerOpen(true)}>
          <Plus size={18} /> הוסף תרגיל
        </button>
        <button className="btn h-11 w-full text-sm text-rose-300/80" onClick={() => setCancelOpen(true)}>
          ביטול אימון
        </button>
      </div>

      <RestTimer />

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercisesToActive} />

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title="לסיים את האימון?"
        footer={
          <button
            className="btn-primary w-full"
            onClick={() => {
              const result = finishWorkout()
              setFinishOpen(false)
              if (result?.session) navigate('/active', { replace: true, state: { result } })
              else { toast('לא סומנו סטים — האימון לא נשמר'); navigate('/', { replace: true }) }
            }}
          >
            שמור וסיים
          </button>
        }
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-ink-800 p-3"><Clock size={16} className="mx-auto mb-1 text-zinc-500" /><div className="tabular font-bold">{fmtClock((now - active.startedAt) / 1000)}</div></div>
          <div className="rounded-xl bg-ink-800 p-3"><Check size={16} className="mx-auto mb-1 text-zinc-500" /><div className="tabular font-bold">{done.length} סטים</div></div>
          <div className="rounded-xl bg-ink-800 p-3"><Flame size={16} className="mx-auto mb-1 text-zinc-500" /><div className="tabular font-bold">{Math.round(volume)} ק״ג</div></div>
        </div>
        {undone > 0 && (
          <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
            {undone} סטים לא סומנו כהושלמו ולא יישמרו.
          </p>
        )}
      </Sheet>

      <ConfirmSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="לבטל את האימון?"
        message="כל מה שהזנת באימון הזה יימחק ולא יישמר ביומן."
        confirmText="בטל אימון"
        danger
        onConfirm={() => { cancelWorkout(); navigate('/', { replace: true }) }}
      />
    </div>
  )
}

export default function ActiveWorkout() {
  const active = useStore((s) => s.active)
  const exMap = useExerciseMap()
  const result = useLocation().state?.result
  if (!active && result) return <Summary result={result} exMap={exMap} />
  if (!active) return <Navigate to="/" replace />
  return <ActiveView />
}
