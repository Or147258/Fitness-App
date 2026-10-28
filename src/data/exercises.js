// קבוצות שרירים — המחלקות מוגדרות במלואן כדי ש-Tailwind ישמור אותן ב-build
export const MUSCLES = [
  { id: 'chest', name: 'חזה', chip: 'bg-rose-500/15 text-rose-300', grad: 'from-rose-500/30', dot: 'bg-rose-400' },
  { id: 'back', name: 'גב', chip: 'bg-sky-500/15 text-sky-300', grad: 'from-sky-500/30', dot: 'bg-sky-400' },
  { id: 'legs', name: 'רגליים', chip: 'bg-amber-500/15 text-amber-300', grad: 'from-amber-500/30', dot: 'bg-amber-400' },
  { id: 'shoulders', name: 'כתפיים', chip: 'bg-violet-500/15 text-violet-300', grad: 'from-violet-500/30', dot: 'bg-violet-400' },
  { id: 'biceps', name: 'יד קדמית', chip: 'bg-lime-500/15 text-lime-300', grad: 'from-lime-500/30', dot: 'bg-lime-400' },
  { id: 'triceps', name: 'יד אחורית', chip: 'bg-teal-500/15 text-teal-300', grad: 'from-teal-500/30', dot: 'bg-teal-400' },
]

export const muscleById = (id) => MUSCLES.find((m) => m.id === id) ?? MUSCLES[0]

const list = {
  chest: [
    ['bench-press', 'לחיצת חזה במוט'],
    ['incline-bench-press', 'לחיצת חזה בשיפוע עליון במוט'],
    ['db-bench-press', 'לחיצת חזה במשקולות'],
    ['incline-db-press', 'לחיצת חזה בשיפוע עליון במשקולות'],
    ['db-fly', 'פרפר במשקולות'],
    ['cable-crossover', 'קרוס-אובר בכבלים'],
    ['pec-deck', 'מכונת פרפר'],
    ['chest-press-machine', 'מכונת לחיצת חזה'],
    ['chest-dips', 'מקבילים (דגש חזה)'],
    ['push-ups', 'שכיבות סמיכה'],
  ],
  back: [
    ['pull-ups', 'מתח'],
    ['lat-pulldown', 'פולי עליון'],
    ['barbell-row', 'חתירה במוט'],
    ['db-row', 'חתירה במשקולת ביד אחת'],
    ['seated-cable-row', 'חתירה בכבל בישיבה'],
    ['t-bar-row', 'חתירת T-Bar'],
    ['deadlift', 'דדליפט'],
    ['straight-arm-pulldown', 'פולאובר בכבל ידיים ישרות'],
    ['back-extension', 'פשיטת גב (היפר-אקסטנשן)'],
  ],
  legs: [
    ['squat', 'סקוואט במוט'],
    ['leg-press', 'לחיצת רגליים'],
    ['romanian-deadlift', 'דדליפט רומני'],
    ['lunges', 'מכרעים (לאנג׳ים)'],
    ['bulgarian-split-squat', 'סקוואט בולגרי'],
    ['hack-squat', 'האק סקוואט'],
    ['leg-extension', 'פשיטת ברכיים'],
    ['leg-curl', 'כפיפת ברכיים'],
    ['hip-thrust', 'היפ ת׳ראסט'],
    ['calf-raise', 'הרמות עקבים'],
  ],
  shoulders: [
    ['overhead-press', 'לחיצת כתפיים במוט בעמידה'],
    ['db-shoulder-press', 'לחיצת כתפיים במשקולות'],
    ['lateral-raise', 'הרחקת כתפיים במשקולות'],
    ['cable-lateral-raise', 'הרחקת כתפיים בכבל'],
    ['front-raise', 'הרמה קדמית'],
    ['rear-delt-fly', 'פרפר אחורי'],
    ['face-pull', 'פייס פול'],
    ['upright-row', 'חתירה לסנטר'],
    ['shrugs', 'משיכות כתפיים (שראגס)'],
  ],
  biceps: [
    ['barbell-curl', 'כפיפת מרפקים במוט'],
    ['db-curl', 'כפיפת מרפקים במשקולות'],
    ['hammer-curl', 'כפיפת פטיש'],
    ['incline-db-curl', 'כפיפה בספסל משופע'],
    ['preacher-curl', 'כפיפה בספסל סקוט'],
    ['cable-curl', 'כפיפת מרפקים בכבל'],
    ['concentration-curl', 'כפיפת ריכוז'],
  ],
  triceps: [
    ['triceps-pushdown', 'פשיטת מרפקים בכבל (מוט)'],
    ['rope-pushdown', 'פשיטת מרפקים בכבל (חבל)'],
    ['skull-crusher', 'מגהץ (סקאל קראשר)'],
    ['overhead-extension', 'פשיטה מעל הראש'],
    ['close-grip-bench', 'לחיצת חזה באחיזה צרה'],
    ['triceps-dips', 'מקבילים (דגש יד אחורית)'],
    ['kickback', 'קיקבק במשקולת'],
  ],
}

/** איור מונפש מובנה (נוצר ע"י scripts/gen-exercise-art.mjs) */
export const defaultMedia = (id) => `/exercises/${id}.svg`

/** המאגר המובנה. id קבוע (לא אקראי) כדי שאותו תרגיל יזוהה בכל מכשיר ובמסד הנתונים */
export const BUILTIN_EXERCISES = Object.entries(list).flatMap(([muscle, items]) =>
  items.map(([id, name]) => ({ id, name, muscle, builtin: true, mediaUrl: defaultMedia(id), mediaType: 'image', notes: '' })),
)

export const PROGRAM_PRESETS = {
  letters: (n) => Array.from({ length: n }, (_, i) => `אימון ${String.fromCharCode(65 + i)}`),
  ppl: () => ['Push', 'Pull', 'Legs'],
  upperLower: () => ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
  fullBody: (n) => Array.from({ length: n }, (_, i) => `פול באדי ${i + 1}`),
}

/** משלים איור ברירת מחדל לתרגיל מובנה שעוד אין לו תמונה (משתמשים קיימים / נתונים מהענן) */
export const withDefaultMedia = (e) =>
  e.builtin && !e.mediaUrl ? { ...e, mediaUrl: defaultMedia(e.id), mediaType: 'image' } : e
