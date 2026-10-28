/**
 * סנכרון Offline-First מול Firebase (Auth + Firestore)
 *
 * כל הנתונים של משתמש נשמרים תחת users/{uid} — ראה README לתיאור המבנה המלא.
 *  1. כל פעולה באפליקציה נשמרת מיד מקומית ונכנסת ל-outbox.
 *  2. pushOutbox() כותב את השינויים ל-Firestore (שמחזיק תור משלו כשאין קליטה).
 *  3. pullAll() מוריד מהענן את הנתונים של המשתמש המחובר בלבד ומחליף את המקומיים.
 */
import { create } from 'zustand'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { collection, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase'
import { useStore } from '../store/useStore'
import { computePRs } from './prs'
import { weekStartKey, toKey, fromKey, addDays } from './date'

export const useSyncStatus = create(() => ({
  authReady: !isFirebaseConfigured, // true אחרי שידוע אם יש משתמש מחובר
  user: null,
  status: 'idle', // idle | syncing | error | offline | pending
  error: null,
}))

/* ---------- נתיבים: הכל תחת המשתמש ---------- */
const userDoc = (uid) => doc(db, 'users', uid)
const col = (uid, name) => collection(db, 'users', uid, name)
const ref = (uid, name, id) => doc(db, 'users', uid, name, id)

/* ---------- בניית פעולות כתיבה מה-outbox ---------- */
function weeklyAverageOps(uid, weights, dateKey) {
  const ws = weekStartKey(dateKey)
  const we = toKey(addDays(fromKey(ws), 6))
  const inWeek = weights.filter((w) => w.date >= ws && w.date <= we).map((w) => w.kg)
  const r = ref(uid, 'weeklyAverages', ws)
  if (!inWeek.length) return [{ type: 'delete', ref: r }]
  const avg = inWeek.reduce((a, b) => a + b, 0) / inWeek.length
  return [{
    type: 'set',
    ref: r,
    data: {
      weekStart: ws,
      weekEnd: we,
      avg: Math.round(avg * 100) / 100,
      count: inWeek.length,
      min: Math.min(...inWeek),
      max: Math.max(...inWeek),
      updatedAt: serverTimestamp(),
    },
  }]
}

const clean = (o) => JSON.parse(JSON.stringify(o)) // Firestore לא מקבל undefined

function opsFor(op, state, uid) {
  const del = (name) => [{ type: 'delete', ref: ref(uid, name, op.id) }]
  switch (op.entity) {
    case 'weight': {
      const w = state.weights.find((x) => x.date === op.id)
      const main = op.kind === 'delete' || !w
        ? del('weights')
        : [{ type: 'set', ref: ref(uid, 'weights', op.id), data: { date: w.date, kg: w.kg, updatedAt: serverTimestamp() } }]
      return [...main, ...weeklyAverageOps(uid, state.weights, op.id)]
    }
    case 'exercise': {
      const e = state.exercises.find((x) => x.id === op.id)
      if (op.kind === 'delete' || !e) return del('exercises')
      return [{ type: 'set', ref: ref(uid, 'exercises', e.id), data: clean({
        name: e.name, muscle: e.muscle, builtin: !!e.builtin,
        mediaUrl: e.mediaUrl ?? '', mediaType: e.mediaType ?? '', notes: e.notes ?? '',
      }) }]
    }
    case 'program': {
      const position = state.programs.findIndex((x) => x.id === op.id)
      const p = state.programs[position]
      if (op.kind === 'delete' || !p) return del('programs')
      return [{ type: 'set', ref: ref(uid, 'programs', p.id), data: clean({
        name: p.name,
        position,
        exercises: p.exercises.map((x) => ({ uid: x.uid, exerciseId: x.exerciseId, sets: x.sets, reps: x.reps ?? '', restSec: x.restSec ?? null })),
      }) }]
    }
    case 'session': {
      const s = state.sessions.find((x) => x.id === op.id)
      if (op.kind === 'delete' || !s) return del('sessions')
      return [{ type: 'set', ref: ref(uid, 'sessions', s.id), data: clean({
        programId: s.programId ?? null, programName: s.programName, date: s.date,
        startedAt: s.startedAt, endedAt: s.endedAt, durationSec: s.durationSec, exercises: s.exercises,
      }) }]
    }
    case 'settings':
      return [{ type: 'set', ref: userDoc(uid), merge: true, data: {
        email: auth.currentUser?.email ?? null, settings: state.settings, updatedAt: serverTimestamp(),
      } }]
    default:
      return []
  }
}

/** שיאים אישיים: personalRecords/{exerciseId} — מחושבים מחדש מכל ההיסטוריה */
async function prOps(uid, sessions) {
  const prs = computePRs(sessions)
  const existing = await getDocs(col(uid, 'personalRecords')).catch(() => null)
  const ops = Object.entries(prs).map(([exerciseId, pr]) => ({
    type: 'set', ref: ref(uid, 'personalRecords', exerciseId), data: { ...pr, updatedAt: serverTimestamp() },
  }))
  existing?.forEach((d) => { if (!prs[d.id]) ops.push({ type: 'delete', ref: d.ref }) })
  return ops
}

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r('timeout'), ms))])

/** כותב את ה-outbox ל-Firestore. מחזיר true אם השרת אישר הכל */
export async function pushOutbox() {
  const user = auth?.currentUser
  if (!user) return false
  const state = useStore.getState()
  const ops = [...state.outbox]
  if (!ops.length) return true

  let writes = ops.flatMap((op) => opsFor(op, state, user.uid))
  if (ops.some((o) => o.entity === 'session')) writes = writes.concat(await prOps(user.uid, state.sessions))

  // מחוץ לבאץ׳ אחד יש מגבלה של 500 פעולות
  const commits = []
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(db)
    for (const w of writes.slice(i, i + 400)) {
      if (w.type === 'delete') batch.delete(w.ref)
      else batch.set(w.ref, w.data, w.merge ? { merge: true } : undefined)
    }
    commits.push(batch.commit())
  }
  // Firestore שומר את הכתיבות במטמון המקומי ושולח אותן כשיש חיבור — אפשר להוריד מה-outbox
  useStore.getState().ackOps(ops)

  const result = await withTimeout(Promise.all(commits), 12000).catch((err) => {
    // נדחה ע״י השרת (למשל חוקי אבטחה) — מחזירים לתור כדי לא לאבד נתונים
    useStore.setState((s) => ({ outbox: [...s.outbox, ...ops.filter((o) => !s.outbox.some((x) => x.entity === o.entity && x.id === o.id))] }))
    throw err
  })
  return result !== 'timeout'
}

/** מוריד את כל הנתונים של המשתמש המחובר */
export async function pullAll() {
  const uid = auth.currentUser.uid
  const [w, e, p, s, u] = await Promise.all([
    getDocs(col(uid, 'weights')),
    getDocs(col(uid, 'exercises')),
    getDocs(col(uid, 'programs')),
    getDocs(col(uid, 'sessions')),
    getDoc(userDoc(uid)),
  ])
  const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  useStore.getState().replaceFromRemote(keepPending({
    weights: rows(w).map((r) => ({ date: r.date ?? r.id, kg: Number(r.kg) })).sort((a, b) => a.date.localeCompare(b.date)),
    exercises: rows(e).map((r) => ({
      id: r.id, name: r.name, muscle: r.muscle, builtin: !!r.builtin,
      mediaUrl: r.mediaUrl ?? '', mediaType: r.mediaType ?? '', notes: r.notes ?? '',
    })),
    programs: rows(p)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((r) => ({ id: r.id, name: r.name, exercises: r.exercises ?? [] })),
    sessions: rows(s)
      .map((r) => ({
        id: r.id, programId: r.programId ?? null, programName: r.programName, date: r.date,
        startedAt: r.startedAt, endedAt: r.endedAt, durationSec: r.durationSec, exercises: r.exercises ?? [],
      }))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    settings: u.exists() ? u.data().settings : null,
  }))
}

/**
 * שינויים מקומיים שעוד ממתינים ב-outbox גוברים על מה שהגיע מהענן
 * (אחרת שקילה שהוזנה בזמן שהמשיכה רצה הייתה נדרסת)
 */
function keepPending(remote) {
  const local = useStore.getState()
  const pending = (entity) => new Map(local.outbox.filter((o) => o.entity === entity).map((o) => [o.id, o.kind]))
  const merge = (remoteList, localList, entity, key = (x) => x.id) => {
    const p = pending(entity)
    if (!p.size) return remoteList
    const out = remoteList.filter((x) => !p.has(key(x)))
    for (const [id, kind] of p) {
      const mine = kind === 'upsert' && localList.find((x) => key(x) === id)
      if (mine) out.push(mine)
    }
    return out
  }
  return {
    weights: merge(remote.weights, local.weights, 'weight', (w) => w.date).sort((a, b) => a.date.localeCompare(b.date)),
    exercises: merge(remote.exercises, local.exercises, 'exercise'),
    programs: (() => {
      const merged = merge(remote.programs, local.programs, 'program')
      const order = (x) => { const i = local.programs.findIndex((p) => p.id === x.id); return i < 0 ? 1e6 + remote.programs.indexOf(x) : i }
      return pending('program').size ? merged.sort((a, b) => order(a) - order(b)) : merged
    })(),
    sessions: merge(remote.sessions, local.sessions, 'session').sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
    settings: pending('settings').size ? null : remote.settings,
  }
}

let running = null

/** סנכרון מלא: שליחת שינויים ואז משיכה מהענן */
export function syncNow() {
  if (running) return running
  running = (async () => {
    if (!auth?.currentUser) return
    useSyncStatus.setState({ status: 'syncing', error: null })
    try {
      const confirmed = await pushOutbox()
      if (!navigator.onLine) return useSyncStatus.setState({ status: 'offline' })
      await pullAll()
      useSyncStatus.setState({ status: confirmed ? 'idle' : 'pending' })
    } catch (err) {
      console.error(err)
      useSyncStatus.setState({ status: 'error', error: hebrewError(err) })
    }
  })().finally(() => { running = null })
  return running
}

/** שליחה בלבד (אחרי שינוי מקומי) */
export async function pushSoon() {
  if (running || !auth?.currentUser) return
  try {
    useSyncStatus.setState({ status: 'syncing' })
    const confirmed = await pushOutbox()
    useSyncStatus.setState({ status: !navigator.onLine ? 'offline' : confirmed ? 'idle' : 'pending', error: null })
  } catch (err) {
    useSyncStatus.setState({ status: 'error', error: hebrewError(err) })
  }
}

/* ---------- התחברות ---------- */
const hasLocalData = (s) => s.weights.length || s.sessions.length || s.programs.length

/** מחליף את הנתונים במכשיר לפי המשתמש שמחובר — כל משתמש רואה רק את שלו */
async function onUserChanged(user) {
  const store = useStore.getState()
  if (!user) {
    // אין משתמש: לא משאירים במכשיר נתונים של משתמש אחר
    if (store.ownerUid) store.resetAll()
    useSyncStatus.setState({ user: null, authReady: true, status: 'idle', error: null })
    return
  }
  if (store.ownerUid && store.ownerUid !== user.uid) store.resetAll()
  const legacy = !useStore.getState().ownerUid && hasLocalData(useStore.getState())
  useStore.getState().setOwner(user.uid)
  // נתונים שנשמרו במכשיר לפני שהיו חשבונות — עולים לחשבון בהתחברות הראשונה
  if (legacy) useStore.getState().enqueueEverything()
  else if (!useStore.getState().lastSyncAt) useStore.getState().clearOutbox()
  useSyncStatus.setState({ user, authReady: true })
  await syncNow()
}

let initialized = false
export function initAuth() {
  if (!auth || initialized) return
  initialized = true
  onAuthStateChanged(auth, (user) => { onUserChanged(user) })
  window.addEventListener('online', () => syncNow())
  window.addEventListener('offline', () => useSyncStatus.setState({ status: 'offline' }))
  document.addEventListener('visibilitychange', () => {
    // חוזרים לאפליקציה → מושכים שינויים ממכשירים אחרים (רק אם אין אימון פעיל)
    if (document.visibilityState === 'visible' && !useStore.getState().active) syncNow()
  })
}

export async function signIn(email, password) {
  await signInWithEmailAndPassword(auth, email.trim(), password)
}

export async function signUp(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
  // מסמך הפרופיל של המשתמש החדש: users/{uid}
  const batch = writeBatch(db)
  batch.set(userDoc(user.uid), { email: user.email, createdAt: serverTimestamp() }, { merge: true })
  batch.commit().catch(() => {})
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email.trim())
}

/** שולח שינויים אחרונים, מתנתק ומנקה את המכשיר */
export async function logOut() {
  await withTimeout(pushOutbox().catch(() => {}), 4000)
  await signOut(auth)
  useStore.getState().resetAll()
  window.history.replaceState(null, '', '/') // המשתמש הבא מתחיל בדף הבית
}

/* ---------- הודעות שגיאה בעברית ---------- */
const ERRORS = {
  'auth/invalid-email': 'כתובת האימייל לא תקינה',
  'auth/missing-email': 'צריך להזין אימייל',
  'auth/missing-password': 'צריך להזין סיסמה',
  'auth/invalid-credential': 'האימייל או הסיסמה שגויים',
  'auth/wrong-password': 'האימייל או הסיסמה שגויים',
  'auth/user-not-found': 'לא נמצא משתמש עם האימייל הזה',
  'auth/email-already-in-use': 'כבר קיים חשבון עם האימייל הזה — נסה להתחבר',
  'auth/weak-password': 'הסיסמה חלשה מדי — לפחות 6 תווים',
  'auth/too-many-requests': 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות',
  'auth/network-request-failed': 'אין חיבור לאינטרנט',
  'auth/operation-not-allowed': 'התחברות עם אימייל וסיסמה לא מופעלת ב-Firebase (ראה README)',
  'auth/configuration-not-found': 'Authentication לא הופעל בפרויקט ה-Firebase (ראה README)',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'מפתח ה-API של Firebase שגוי — בדוק את משתני הסביבה',
  'permission-denied': 'אין הרשאה — בדוק את חוקי האבטחה של Firestore (ראה README)',
  unavailable: 'השרת לא זמין כרגע — השינויים יישלחו כשיחזור החיבור',
}

export function hebrewError(err) {
  return ERRORS[err?.code] ?? err?.message ?? 'שגיאה לא ידועה'
}
