// שיאים אישיים והיסטוריה — מחושבים מתוך היסטוריית האימונים

const sortByStart = (sessions) => [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt))

/** האם סט a טוב יותר מ-b: משקל גבוה יותר, ובשוויון — יותר חזרות */
export const isBetter = (a, b) => !b || a.weight > b.weight || (a.weight === b.weight && a.reps > b.reps)

/** מפה: exerciseId → { weight, reps, date, sessionId } */
export function computePRs(sessions) {
  const prs = {}
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const st of ex.sets) {
        if (!(st.reps > 0)) continue
        if (isBetter(st, prs[ex.exerciseId])) {
          prs[ex.exerciseId] = { weight: st.weight, reps: st.reps, date: s.date, sessionId: s.id }
        }
      }
    }
  }
  return prs
}

/** הסטים מהפעם האחרונה שבה ביצעת את התרגיל */
export function lastPerformance(sessions, exerciseId) {
  const sorted = sortByStart(sessions)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const ex = sorted[i].exercises.find((x) => x.exerciseId === exerciseId)
    if (ex?.sets.length) return ex.sets
  }
  return null
}

/** היסטוריה של תרגיל: [{ date, sessionId, programName, sets, best }] מהחדש לישן */
export function exerciseHistory(sessions, exerciseId, limit = 10) {
  const out = []
  const sorted = sortByStart(sessions)
  for (let i = sorted.length - 1; i >= 0 && out.length < limit; i--) {
    const s = sorted[i]
    const ex = s.exercises.find((x) => x.exerciseId === exerciseId)
    if (!ex?.sets.length) continue
    const best = ex.sets.reduce((b, st) => (isBetter(st, b) ? st : b), null)
    out.push({ date: s.date, sessionId: s.id, programName: s.programName, sets: ex.sets, best })
  }
  return out
}

export const fmtSet = (st) => (st.weight > 0 ? `${st.weight}×${st.reps}` : `${st.reps} חזרות`)
export const fmtPR = (pr) => (pr ? (pr.weight > 0 ? `${pr.weight} ק״ג × ${pr.reps}` : `${pr.reps} חזרות`) : '—')

export const sessionVolume = (session) =>
  session.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, st) => s + st.weight * st.reps, 0), 0)

export const sessionSetCount = (session) => session.exercises.reduce((n, ex) => n + ex.sets.length, 0)

/** 1RM משוער (נוסחת Epley) — מה המשקל המקסימלי לחזרה אחת לפי סט עם כמה חזרות */
export const estimate1RM = (st) => (st.reps <= 1 ? st.weight : st.weight * (1 + Math.min(st.reps, 12) / 30))

/** נקודה לכל אימון שבו בוצע התרגיל: משקל מקסימלי, 1RM משוער, נפח וחזרות מקסימליות */
export function exerciseProgress(sessions, exerciseId) {
  return [...sessions]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .flatMap((s) => {
      const ex = s.exercises.find((x) => x.exerciseId === exerciseId)
      if (!ex?.sets.length) return []
      return [{
        date: s.date,
        maxWeight: Math.max(...ex.sets.map((x) => x.weight)),
        e1rm: Math.max(...ex.sets.map(estimate1RM)),
        volume: ex.sets.reduce((v, x) => v + x.weight * x.reps, 0),
        maxReps: Math.max(...ex.sets.map((x) => x.reps)),
      }]
    })
}
