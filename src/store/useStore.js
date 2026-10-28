import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILTIN_EXERCISES, defaultMedia, withDefaultMedia } from '../data/exercises'

const BUILTIN_BY_ID = Object.fromEntries(BUILTIN_EXERCISES.map((e) => [e.id, e]))
const isPristineBuiltin = (e) => {
  const b = BUILTIN_BY_ID[e.id]
  return e.builtin && b && e.name === b.name && e.muscle === b.muscle && !e.notes && (!e.mediaUrl || e.mediaUrl === defaultMedia(e.id))
}
import { uid } from '../lib/ids'
import { toKey } from '../lib/date'
import { computePRs, isBetter, lastPerformance } from '../lib/prs'

export const DEFAULT_SETTINGS = {
  restSec: 90, // טיימר מנוחה ברירת מחדל
  sound: true,
  vibrate: true,
  weightGoal: 'cut', // cut | bulk | maintain — קובע אם ירידה מוצגת בירוק או באדום
  showGlucose: true, // סוכר בכרטיס המדידות בדף הבית
  showPressure: true, // לחץ דם בכרטיס המדידות בדף הבית
  goalWeight: null, // משקל יעד בק״ג
  goalStart: null, // { date, kg } — נקודת ההתחלה כשהוגדר היעד
  reportName: '', // שם שיופיע בדוח לרופא
  reminders: { weight: '07:30', glucose: '07:45', pressure: '08:00' },
}

/**
 * Outbox: תור של שינויים שעוד לא נשלחו ל-Firestore.
 * כל שינוי נשמר קודם מקומית (מיידי, עובד בלי קליטה) ונשלח לענן תחת ה-UID של המשתמש.
 */
function enqueue(outbox, entity, id, kind = 'upsert', extra = {}) {
  return [...outbox.filter((o) => !(o.entity === entity && o.id === id)), { entity, id, kind, at: Date.now(), ...extra }]
}

export const GLUCOSE_CONTEXTS = [
  { id: 'fasting', label: 'בצום' },
  { id: 'before', label: 'לפני ארוחה' },
  { id: 'after', label: 'אחרי ארוחה' },
  { id: 'bedtime', label: 'לפני שינה' },
  { id: 'other', label: 'אחר' },
]

const byDateTime = (a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')

const toNum = (v) => {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function buildActiveExercise(exerciseId, sessions, targetSets = 3, restSec = null, targetReps = '') {
  const prev = lastPerformance(sessions, exerciseId) ?? []
  const count = Math.max(1, targetSets || prev.length || 3)
  return {
    uid: uid(),
    exerciseId,
    restSec,
    targetReps,
    sets: Array.from({ length: count }, (_, i) => {
      const p = prev[i] ?? prev[prev.length - 1]
      return { uid: uid(), weight: '', reps: '', done: false, prevWeight: p?.weight ?? null, prevReps: p?.reps ?? null }
    }),
  }
}

const initialData = {
  weights: [], // { date: 'YYYY-MM-DD', kg }
  glucose: [], // מדידות סוכר: { id, date, time: 'HH:MM', value (mg/dL), context, note }
  pressure: [], // לחץ דם: { id, date, time, sys, dia, pulse, note }
  exercises: BUILTIN_EXERCISES, // { id, name, muscle, builtin, mediaUrl, mediaType, notes }
  programs: [], // { id, name, exercises: [{ uid, exerciseId, sets, reps, restSec }] }
  sessions: [], // היסטוריה: { id, programId, programName, date, startedAt, endedAt, durationSec, exercises: [{ exerciseId, sets: [{ weight, reps }] }] }
  active: null, // האימון הפעיל (נשמר גם אם האפליקציה נסגרת)
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialData,
      settings: DEFAULT_SETTINGS,
      outbox: [],
      lastSyncAt: null,
      ownerUid: null,

      /* ---------- משקל ---------- */
      saveWeight: (date, kg) =>
        set((s) => ({
          weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)),
          outbox: enqueue(s.outbox, 'weight', date),
        })),

      deleteWeight: (date) =>
        set((s) => ({
          weights: s.weights.filter((w) => w.date !== date),
          outbox: enqueue(s.outbox, 'weight', date, 'delete'),
        })),

      /* ---------- סוכר בדם ---------- */
      addGlucose: (data) => {
        const id = uid()
        set((s) => ({
          glucose: [...s.glucose, { note: '', ...data, id }].sort(byDateTime),
          outbox: enqueue(s.outbox, 'glucose', id),
        }))
        return id
      },

      updateGlucose: (id, patch) =>
        set((s) => {
          const prev = s.glucose.find((g) => g.id === id)
          return {
            glucose: s.glucose.map((g) => (g.id === id ? { ...g, ...patch } : g)).sort(byDateTime),
            // אם התאריך השתנה — גם הממוצע של השבוע הקודם מתעדכן
            outbox: enqueue(s.outbox, 'glucose', id, 'upsert', { date: prev?.date }),
          }
        }),

      deleteGlucose: (id) =>
        set((s) => {
          const prev = s.glucose.find((g) => g.id === id)
          return {
            glucose: s.glucose.filter((g) => g.id !== id),
            outbox: enqueue(s.outbox, 'glucose', id, 'delete', { date: prev?.date }),
          }
        }),

      /* ---------- לחץ דם ---------- */
      addPressure: (data) => {
        const id = uid()
        set((s) => ({
          pressure: [...s.pressure, { note: '', pulse: null, ...data, id }].sort(byDateTime),
          outbox: enqueue(s.outbox, 'pressure', id),
        }))
        return id
      },

      updatePressure: (id, patch) =>
        set((s) => {
          const prev = s.pressure.find((x) => x.id === id)
          return {
            pressure: s.pressure.map((x) => (x.id === id ? { ...x, ...patch } : x)).sort(byDateTime),
            outbox: enqueue(s.outbox, 'pressure', id, 'upsert', { date: prev?.date }),
          }
        }),

      deletePressure: (id) =>
        set((s) => {
          const prev = s.pressure.find((x) => x.id === id)
          return {
            pressure: s.pressure.filter((x) => x.id !== id),
            outbox: enqueue(s.outbox, 'pressure', id, 'delete', { date: prev?.date }),
          }
        }),

      /* ---------- מאגר תרגילים ---------- */
      addExercise: (data) => {
        const id = uid()
        set((s) => ({
          exercises: [...s.exercises, { mediaUrl: '', mediaType: '', notes: '', ...data, id, builtin: false }],
          outbox: enqueue(s.outbox, 'exercise', id),
        }))
        return id
      },

      updateExercise: (id, patch) =>
        set((s) => ({
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          outbox: enqueue(s.outbox, 'exercise', id),
        })),

      /** מחיקה מותרת רק לתרגיל שלא מופיע בהיסטוריה (כדי לא לשבור שיאים ויומן) */
      deleteExercise: (id) => {
        const s = get()
        if (s.sessions.some((se) => se.exercises.some((x) => x.exerciseId === id))) return false
        let outbox = s.outbox
        const programs = s.programs.map((p) => {
          if (!p.exercises.some((x) => x.exerciseId === id)) return p
          outbox = enqueue(outbox, 'program', p.id)
          return { ...p, exercises: p.exercises.filter((x) => x.exerciseId !== id) }
        })
        outbox = enqueue(outbox, 'exercise', id, 'delete')
        set({ programs, exercises: s.exercises.filter((e) => e.id !== id), outbox })
        return true
      },

      /* ---------- תוכניות אימון ---------- */
      createPrograms: (names) => {
        const ids = []
        set((s) => {
          let outbox = s.outbox
          const created = names.map((name) => {
            const id = uid()
            ids.push(id)
            outbox = enqueue(outbox, 'program', id)
            return { id, name, exercises: [] }
          })
          return { programs: [...s.programs, ...created], outbox }
        })
        return ids
      },

      renameProgram: (id, name) =>
        set((s) => ({
          programs: s.programs.map((p) => (p.id === id ? { ...p, name } : p)),
          outbox: enqueue(s.outbox, 'program', id),
        })),

      updateProgramExercises: (id, fn) =>
        set((s) => ({
          programs: s.programs.map((p) => (p.id === id ? { ...p, exercises: fn(p.exercises) } : p)),
          outbox: enqueue(s.outbox, 'program', id),
        })),

      addExercisesToProgram: (id, exerciseIds) =>
        get().updateProgramExercises(id, (list) => [
          ...list,
          ...exerciseIds.map((exerciseId) => ({ uid: uid(), exerciseId, sets: 3, reps: '8-12', restSec: null })),
        ]),

      moveProgram: (id, dir) =>
        set((s) => {
          const i = s.programs.findIndex((p) => p.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= s.programs.length) return {}
          const programs = [...s.programs]
          ;[programs[i], programs[j]] = [programs[j], programs[i]]
          let outbox = s.outbox
          programs.forEach((p) => { outbox = enqueue(outbox, 'program', p.id) }) // המיקום השתנה
          return { programs, outbox }
        }),

      deleteProgram: (id) =>
        set((s) => ({
          programs: s.programs.filter((p) => p.id !== id),
          outbox: enqueue(s.outbox, 'program', id, 'delete'),
        })),

      /* ---------- אימון פעיל ---------- */
      startWorkout: (programId) => {
        const s = get()
        if (s.active) return
        const p = s.programs.find((x) => x.id === programId)
        set({
          active: {
            id: uid(),
            programId: p?.id ?? null,
            programName: p?.name ?? 'אימון חופשי',
            startedAt: Date.now(),
            exercises: (p?.exercises ?? []).map((pe) =>
              buildActiveExercise(pe.exerciseId, s.sessions, pe.sets, pe.restSec, pe.reps),
            ),
            rest: null,
          },
        })
      },

      updateActive: (fn) => set((s) => (s.active ? { active: fn(s.active) } : {})),

      updateSet: (ei, si, patch) =>
        get().updateActive((a) => ({
          ...a,
          exercises: a.exercises.map((ex, i) =>
            i !== ei ? ex : { ...ex, sets: ex.sets.map((st, j) => (j === si ? { ...st, ...patch } : st)) },
          ),
        })),

      /** מסמן/מבטל סט. מחזיר false אם חסרות חזרות. סימון מפעיל טיימר מנוחה */
      toggleSet: (ei, si) => {
        const s = get()
        const ex = s.active?.exercises[ei]
        const st = ex?.sets[si]
        if (!st) return false
        const done = !st.done
        const weight = st.weight !== '' ? st.weight : done && st.prevWeight != null ? String(st.prevWeight) : st.weight
        const reps = st.reps !== '' ? st.reps : done && st.prevReps != null ? String(st.prevReps) : st.reps
        if (done && !(toNum(reps) > 0)) return false
        const restSec = ex.restSec ?? s.settings.restSec
        get().updateActive((a) => ({
          ...a,
          rest: done && restSec > 0 ? { endsAt: Date.now() + restSec * 1000, duration: restSec } : a.rest,
          exercises: a.exercises.map((x, i) =>
            i !== ei ? x : { ...x, sets: x.sets.map((y, j) => (j === si ? { ...y, done, weight, reps } : y)) },
          ),
        }))
        return true
      },

      addSet: (ei) =>
        get().updateActive((a) => ({
          ...a,
          exercises: a.exercises.map((ex, i) => {
            if (i !== ei) return ex
            const last = ex.sets[ex.sets.length - 1]
            return {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  uid: uid(),
                  weight: last?.weight ?? '',
                  reps: last?.reps ?? '',
                  done: false,
                  prevWeight: last?.prevWeight ?? null,
                  prevReps: last?.prevReps ?? null,
                },
              ],
            }
          }),
        })),

      removeLastSet: (ei) =>
        get().updateActive((a) => ({
          ...a,
          exercises: a.exercises.map((ex, i) => (i !== ei || ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.slice(0, -1) })),
        })),

      addExercisesToActive: (exerciseIds) => {
        const { sessions } = get()
        get().updateActive((a) => ({
          ...a,
          exercises: [...a.exercises, ...exerciseIds.map((id) => buildActiveExercise(id, sessions))],
        }))
      },

      removeActiveExercise: (ei) =>
        get().updateActive((a) => ({ ...a, exercises: a.exercises.filter((_, i) => i !== ei) })),

      moveActiveExercise: (ei, dir) =>
        get().updateActive((a) => {
          const j = ei + dir
          if (j < 0 || j >= a.exercises.length) return a
          const exercises = [...a.exercises]
          ;[exercises[ei], exercises[j]] = [exercises[j], exercises[ei]]
          return { ...a, exercises }
        }),

      setActiveExerciseRest: (ei, restSec) =>
        get().updateActive((a) => ({ ...a, exercises: a.exercises.map((ex, i) => (i === ei ? { ...ex, restSec } : ex)) })),

      adjustRest: (deltaSec) =>
        get().updateActive((a) =>
          a.rest
            ? { ...a, rest: { endsAt: Math.max(Date.now(), a.rest.endsAt + deltaSec * 1000), duration: Math.max(5, a.rest.duration + deltaSec) } }
            : a,
        ),

      clearRest: () => get().updateActive((a) => ({ ...a, rest: null })),

      /** שומר את האימון להיסטוריה (רק סטים שסומנו) ומחזיר שיאים חדשים */
      finishWorkout: () => {
        const s = get()
        const a = s.active
        if (!a) return null
        const prsBefore = computePRs(s.sessions)
        const exercises = a.exercises
          .map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets.filter((x) => x.done).map((x) => ({ weight: toNum(x.weight), reps: Math.round(toNum(x.reps)) })),
          }))
          .filter((ex) => ex.sets.length)

        if (!exercises.length) {
          set({ active: null })
          return { session: null, newPRs: [] }
        }

        const endedAt = Date.now()
        const session = {
          id: a.id,
          programId: a.programId,
          programName: a.programName,
          date: toKey(new Date(a.startedAt)),
          startedAt: new Date(a.startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          durationSec: Math.round((endedAt - a.startedAt) / 1000),
          exercises,
        }
        const newPRs = exercises.flatMap((ex) => {
          const best = ex.sets.reduce((b, st) => (isBetter(st, b) ? st : b), null)
          const prev = prsBefore[ex.exerciseId]
          return isBetter(best, prev) ? [{ exerciseId: ex.exerciseId, best, prev: prev ?? null }] : []
        })
        set((st) => ({ sessions: [...st.sessions, session], active: null, outbox: enqueue(st.outbox, 'session', session.id) }))
        return { session, newPRs }
      },

      cancelWorkout: () => set({ active: null }),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id), outbox: enqueue(s.outbox, 'session', id, 'delete') })),

      /* ---------- הגדרות וגיבוי ---------- */
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch }, outbox: enqueue(s.outbox, 'settings', 'me') })),

      exportData: () => {
        const { weights, glucose, pressure, exercises, programs, sessions, settings } = get()
        return { app: 'fitness-app', version: 1, exportedAt: new Date().toISOString(), weights, glucose, pressure, exercises, programs, sessions, settings }
      },

      importData: (data) => {
        if (!data || !Array.isArray(data.weights) || !Array.isArray(data.sessions)) throw new Error('קובץ לא תקין')
        set({
          weights: data.weights,
          glucose: data.glucose ?? [],
          pressure: data.pressure ?? [],
          exercises: data.exercises?.length ? data.exercises : BUILTIN_EXERCISES,
          programs: data.programs ?? [],
          sessions: data.sessions,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
        })
        get().enqueueEverything()
      },

      /** מנקה את כל הנתונים מהמכשיר (בהתנתקות / החלפת משתמש). הנתונים בענן לא נפגעים */
      resetAll: () => set({ ...initialData, settings: DEFAULT_SETTINGS, outbox: [], lastSyncAt: null, ownerUid: null }),

      /** ה-UID שהנתונים המקומיים שייכים לו (null = נתונים מגרסה ישנה, לפני חשבונות) */
      setOwner: (ownerUid) => set({ ownerUid }),

      /* ---------- עזרי סנכרון (משמשים את lib/sync.js) ---------- */
      enqueueEverything: () =>
        set((s) => {
          let outbox = []
          // תרגילים מובנים שלא נערכו לא צריכים להישמר בענן — הם חלק מהאפליקציה
          s.exercises.filter((e) => !isPristineBuiltin(e)).forEach((e) => { outbox = enqueue(outbox, 'exercise', e.id) })
          s.programs.forEach((p) => { outbox = enqueue(outbox, 'program', p.id) })
          s.weights.forEach((w) => { outbox = enqueue(outbox, 'weight', w.date) })
          s.glucose.forEach((g) => { outbox = enqueue(outbox, 'glucose', g.id) })
          s.pressure.forEach((x) => { outbox = enqueue(outbox, 'pressure', x.id) })
          s.sessions.forEach((x) => { outbox = enqueue(outbox, 'session', x.id) })
          outbox = enqueue(outbox, 'settings', 'me')
          return { outbox }
        }),

      ackOps: (ops) =>
        set((s) => ({ outbox: s.outbox.filter((o) => !ops.some((d) => d.entity === o.entity && d.id === o.id && d.at === o.at)) })),

      replaceFromRemote: ({ weights, glucose, pressure, exercises, programs, sessions, settings }) =>
        set(() => {
          // תרגילים מובנים חדשים (אם נוספו בגרסה חדשה של האפליקציה) נשמרים גם אם עוד לא בענן
          const ids = new Set(exercises.map((e) => e.id))
          return {
            weights,
            glucose: glucose ?? [],
            pressure: pressure ?? [],
            exercises: [...exercises.map(withDefaultMedia), ...BUILTIN_EXERCISES.filter((b) => !ids.has(b.id))],
            programs,
            sessions,
            ...(settings ? { settings: { ...DEFAULT_SETTINGS, ...settings, reminders: { ...DEFAULT_SETTINGS.reminders, ...settings.reminders } } } : {}),
            lastSyncAt: new Date().toISOString(),
          }
        }),

      setLastSync: (iso) => set({ lastSyncAt: iso }),
      clearOutbox: () => set({ outbox: [] }),
    }),
    {
      name: 'fitness-app-v1',
      version: 1,
      // מוסיף תרגילים מובנים שנוספו בגרסאות חדשות בלי לדרוס את הנתונים שלך
      merge: (persisted, current) => {
        const merged = { ...current, ...persisted }
        merged.glucose = merged.glucose ?? []
        merged.pressure = merged.pressure ?? []
        const ids = new Set((merged.exercises ?? []).map((e) => e.id))
        merged.exercises = [...(merged.exercises ?? []).map(withDefaultMedia), ...BUILTIN_EXERCISES.filter((b) => !ids.has(b.id))]
        merged.settings = { ...DEFAULT_SETTINGS, ...persisted?.settings, reminders: { ...DEFAULT_SETTINGS.reminders, ...persisted?.settings?.reminders } }
        return merged
      },
    },
  ),
)

/** בוחר שדות מה-store */
export const useExerciseMap = () => {
  const exercises = useStore((s) => s.exercises)
  return useMemo(() => Object.fromEntries(exercises.map((e) => [e.id, e])), [exercises])
}
