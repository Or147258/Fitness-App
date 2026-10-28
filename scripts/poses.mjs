// תנוחות התחלה (A) וסיום (B) לכל תרגיל במאגר המובנה.
// זוויות: 0=למעלה, 90=ימינה (קדימה), 180=למטה, -90=אחורה. הדמות פונה ימינה.
// w = יעד לכף היד (IK), a = יעד לקרסול, b = כיוון כיפוף המפרק.

const STAND = { hip: [160, 90], torso: 0, leg: { a: [162, 160] }, leg2: { a: [156, 160] } }
const st = (o = {}) => ({ ...STAND, ...o })

// ספסל שטוח ושכיבה עליו
const BENCH = [{ r: [100, 111, 120, 8] }, { l: [[118, 119], [118, 160]] }, { l: [[202, 119], [202, 160]] }]
const LYING = { hip: [190, 104], torso: -90, leg: { a: [232, 160] } }
const ly = (arm, extra = {}) => ({ ...LYING, arm, ...extra })

// ספסל משופע
const INCL = { hip: [192, 110], torso: -58, leg: { a: [232, 160] } }
const INCL_PROPS = [{ l: [[205, 120], [128, 72]], w: 9 }, { l: [[180, 121], [235, 121]], w: 8 }, { l: [[190, 124], [190, 160]] }, { l: [[150, 100], [150, 160]] }]

// ישיבה זקופה על ספסל/מכונה
const SEAT = { hip: [150, 114], torso: 0, leg: { t: 90, s: 178 } }
const SEAT_PROPS = [{ r: [128, 118, 50, 8] }, { l: [[150, 126], [150, 160]] }]
const BACKREST = [{ l: [[138, 116], [138, 52]], w: 8 }]

// הטיה קדימה (חתירות)
const HINGE = { hip: [138, 102], torso: 72, leg: { a: [162, 160] }, leg2: { a: [150, 160] } }

// מתקן מקבילים
const DIPS = [{ l: [[130, 84], [205, 84]], w: 5 }, { l: [[198, 86], [198, 160]], w: 4 }, { l: [[137, 86], [137, 160]], w: 4 }]

export const POSES = {
  /* ===================== חזה ===================== */
  'bench-press': {
    equip: 'barbell', hl: ['chest'], props: BENCH,
    A: ly({ w: [142, 52] }), B: ly({ w: [150, 95] }),
  },
  'incline-bench-press': {
    equip: 'barbell', hl: ['chest'], props: INCL_PROPS,
    A: { ...INCL, arm: { w: [154, 26] } }, B: { ...INCL, arm: { w: [170, 72] } },
  },
  'db-bench-press': {
    equip: 'dumbbell', hl: ['chest'], props: BENCH,
    A: ly({ w: [142, 52] }), B: ly({ w: [146, 100] }),
  },
  'incline-db-press': {
    equip: 'dumbbell', hl: ['chest'], props: INCL_PROPS,
    A: { ...INCL, arm: { w: [154, 26] } }, B: { ...INCL, arm: { w: [164, 78] } },
  },
  'db-fly': {
    equip: 'dumbbell', hl: ['chest'], props: BENCH,
    A: ly({ u: -2, f: 6 }), B: ly({ w: [146, 128], b: 1 }),
  },
  'cable-crossover': {
    equip: 'handle', hl: ['chest'], cable: [40, 18],
    props: [{ l: [[40, 14], [40, 160]], w: 6 }],
    A: { hip: [150, 92], torso: 18, leg: { a: [178, 160] }, leg2: { a: [128, 160] }, arm: { u: -70, f: -45 } },
    B: { hip: [150, 92], torso: 18, leg: { a: [178, 160] }, leg2: { a: [128, 160] }, arm: { u: 140, f: 120 } },
  },
  'pec-deck': {
    equip: 'bar', hl: ['chest'], props: [...SEAT_PROPS, ...BACKREST],
    A: { ...SEAT, arm: { u: -95, f: -5 } }, B: { ...SEAT, arm: { u: 75, f: -5 } },
  },
  'chest-press-machine': {
    equip: 'bar', hl: ['chest'], props: [...SEAT_PROPS, ...BACKREST],
    A: { ...SEAT, arm: { w: [160, 70], b: 1 } }, B: { ...SEAT, arm: { w: [204, 66] } },
  },
  'chest-dips': {
    hl: ['chest'], props: DIPS,
    A: { hip: [158, 82], torso: 10, arm: { w: [167, 84] }, leg: { t: 190, s: 235 } },
    B: { hip: [146, 106], torso: 32, arm: { w: [167, 84], b: -1 }, leg: { t: 222, s: 292 } },
  },
  'push-ups': {
    hl: ['chest'],
    A: { hip: [174, 125], torso: -64, arm: { w: [129, 158] }, leg: { a: [238, 156], b: 1, foot: 165 } },
    B: { hip: [168, 146], torso: -82, arm: { w: [129, 158], b: -1 }, leg: { a: [238, 156], b: 1, foot: 165 } },
  },

  /* ===================== גב ===================== */
  'pull-ups': {
    hl: ['torso'], props: [{ l: [[110, 20], [215, 20]], w: 5 }],
    A: { hip: [166, 128], torso: -5, arm: { w: [162, 22] }, leg: { t: 172, s: 228 }, leg2: { t: 166, s: 222 } },
    B: { hip: [164, 92], torso: -10, arm: { w: [162, 22], b: -1 }, leg: { t: 172, s: 228 }, leg2: { t: 166, s: 222 } },
  },
  'lat-pulldown': {
    equip: 'bar', hl: ['torso'], cable: [172, 6],
    props: [...SEAT_PROPS, { r: [158, 98, 26, 7] }, { l: [[110, 6], [230, 6]], w: 5 }],
    A: { hip: [150, 114], torso: -10, leg: { t: 92, s: 178 }, arm: { w: [170, 18] } },
    B: { hip: [150, 114], torso: -14, leg: { t: 92, s: 178 }, arm: { w: [160, 62], b: -1 } },
  },
  'barbell-row': {
    equip: 'barbell', hl: ['torso'],
    A: { ...HINGE, arm: { w: [186, 136] } }, B: { ...HINGE, arm: { w: [172, 108], b: -1 } },
  },
  'db-row': {
    equip: 'dumbbell', hl: ['torso'],
    props: [{ r: [190, 118, 75, 8] }, { l: [[205, 126], [205, 160]] }, { l: [[255, 126], [255, 160]] }],
    A: { hip: [140, 106], torso: 80, leg: { a: [150, 160] }, arm: { w: [186, 150] }, arm2: { w: [222, 118] } },
    B: { hip: [140, 106], torso: 80, leg: { a: [150, 160] }, arm: { w: [172, 112], b: -1 }, arm2: { w: [222, 118] } },
  },
  'seated-cable-row': {
    equip: 'bar', hl: ['torso'], cable: [262, 132],
    props: [{ r: [100, 138, 70, 8] }, { l: [[220, 120], [220, 160]], w: 7 }, { l: [[262, 60], [262, 160]], w: 6 }],
    A: { hip: [128, 133], torso: 28, leg: { a: [216, 140] }, arm: { w: [208, 112] } },
    B: { hip: [128, 133], torso: -8, leg: { a: [216, 140] }, arm: { w: [150, 110], b: -1 } },
  },
  't-bar-row': {
    equip: 'barbell', hl: ['torso'], cable: [262, 156], props: [{ c: [262, 156, 4] }],
    A: { ...HINGE, torso: 60, arm: { w: [180, 140] } }, B: { ...HINGE, torso: 60, arm: { w: [170, 112], b: -1 } },
  },
  deadlift: {
    equip: 'barbell', hl: ['lowback'], plate: 15,
    A: { hip: [132, 118], torso: 62, leg: { a: [162, 160] }, leg2: { a: [152, 160] }, arm: { w: [176, 145] } },
    B: { hip: [158, 90], torso: 2, leg: { a: [162, 160] }, leg2: { a: [152, 160] }, arm: { w: [162, 97] } },
  },
  'straight-arm-pulldown': {
    equip: 'bar', hl: ['torso'], cable: [262, 14],
    props: [{ l: [[262, 10], [262, 160]], w: 6 }],
    A: { hip: [140, 92], torso: 28, leg: { a: [158, 160] }, leg2: { a: [140, 160] }, arm: { u: 52, f: 52 } },
    B: { hip: [140, 92], torso: 28, leg: { a: [158, 160] }, leg2: { a: [140, 160] }, arm: { u: 172, f: 172 } },
  },
  'back-extension': {
    hl: ['lowback'],
    props: [{ r: [146, 98, 22, 12], rx: 5 }, { l: [[157, 110], [118, 160]], w: 6 }, { c: [114, 146, 6] }],
    A: { hip: [150, 96], torso: 165, headTilt: -10, leg: { t: -128, s: -128, foot: -40 }, arm: { u: 190, f: 40, rel: true } },
    B: { hip: [150, 96], torso: 62, headTilt: -10, leg: { t: -128, s: -128, foot: -40 }, arm: { u: 190, f: 40, rel: true } },
  },

  /* ===================== רגליים ===================== */
  squat: {
    equip: 'barbell', hl: ['th'],
    A: { hip: [155, 90], torso: 2, leg: { a: [162, 160] }, leg2: { a: [154, 160] }, arm: { u: 205, f: 15, rel: true } },
    B: { hip: [128, 128], torso: 42, leg: { a: [162, 160] }, leg2: { a: [154, 160] }, arm: { u: 205, f: 15, rel: true } },
    equipAt: (j) => [j.S[0] - 3, j.S[1] - 2],
  },
  'leg-press': {
    equip: 'platform', hl: ['th'],
    props: [{ l: [[118, 136], [62, 98]], w: 10 }, { l: [[100, 138], [140, 138]], w: 9 }, { l: [[110, 142], [110, 160]] }],
    A: { hip: [116, 126], torso: -56, leg: { a: [146, 92], b: -1, foot: 45 }, arm: { w: [130, 130] } },
    B: { hip: [116, 126], torso: -56, leg: { a: [168, 74], b: -1, foot: 45 }, arm: { w: [130, 130] } },
  },
  'romanian-deadlift': {
    equip: 'barbell', hl: ['th'],
    A: { hip: [158, 90], torso: 2, leg: { a: [162, 160] }, leg2: { a: [152, 160] }, arm: { w: [162, 97] } },
    B: { hip: [130, 96], torso: 74, leg: { a: [162, 160] }, leg2: { a: [152, 160] }, arm: { w: [178, 132] } },
  },
  lunges: {
    equip: 'dumbbell', hl: ['th'],
    A: { hip: [152, 96], torso: 0, leg: { a: [180, 160] }, leg2: { a: [124, 160], b: -1, foot: 120 }, arm: { u: 180, f: 180 } },
    B: { hip: [152, 124], torso: 4, leg: { a: [180, 160] }, leg2: { a: [124, 160], b: -1, foot: 120 }, arm: { u: 182, f: 182 } },
  },
  'bulgarian-split-squat': {
    equip: 'dumbbell', hl: ['th'], props: [{ r: [70, 114, 48, 8] }, { l: [[94, 122], [94, 160]] }],
    A: { hip: [152, 94], torso: 4, leg: { a: [178, 160] }, leg2: { a: [106, 112], b: -1, foot: 200 }, arm: { u: 182, f: 182 } },
    B: { hip: [146, 122], torso: 10, leg: { a: [178, 160] }, leg2: { a: [106, 112], b: -1, foot: 200 }, arm: { u: 184, f: 184 } },
  },
  'hack-squat': {
    hl: ['th'], props: [{ l: [[120, 140], [175, 30]], w: 8 }, { l: [[170, 160], [215, 152]], w: 7 }],
    A: { hip: [150, 92], torso: -14, leg: { a: [184, 156] }, arm: { u: 160, f: 20, rel: true } },
    B: { hip: [134, 124], torso: -14, leg: { a: [184, 156] }, arm: { u: 160, f: 20, rel: true } },
  },
  'leg-extension': {
    equip: 'roller', hl: ['th'], props: [{ r: [118, 112, 52, 8] }, { l: [[122, 112], [116, 50]], w: 8 }, { l: [[140, 120], [140, 160]] }],
    A: { hip: [132, 108], torso: -8, leg: { t: 92, s: 178 }, arm: { w: [150, 112] } },
    B: { hip: [132, 108], torso: -8, leg: { t: 92, s: 98 }, arm: { w: [150, 112] } },
  },
  'leg-curl': {
    equip: 'roller', hl: ['th'], rollerDy: -7, props: [{ r: [80, 108, 130, 8] }, { l: [[100, 116], [100, 160]] }, { l: [[195, 116], [195, 160]] }],
    A: { hip: [175, 100], torso: -90, leg: { t: 90, s: 90, foot: 180 }, arm: { w: [88, 112], b: -1 } },
    B: { hip: [175, 100], torso: -90, leg: { t: 92, s: -5, foot: 85 }, arm: { w: [88, 112], b: -1 } },
  },
  'hip-thrust': {
    equip: 'barbell', hl: ['th'], props: [{ r: [70, 100, 46, 10] }, { l: [[80, 110], [80, 160]] }, { l: [[106, 110], [106, 160]] }],
    A: { hip: [138, 146], torso: -36, leg: { a: [200, 160] }, arm: { wH: [6, -12], b: -1 } },
    B: { hip: [160, 104], torso: -94, leg: { a: [200, 160] }, arm: { wH: [6, -12], b: -1 } },
    equipAt: (j) => [j.H[0] + 6, j.H[1] - 12],
  },
  'calf-raise': {
    hl: ['sh'], props: [{ r: [150, 156, 36, 6], rx: 2 }],
    A: { hip: [158, 84], torso: 0, leg: { a: [160, 152], foot: 95 }, leg2: { a: [154, 152], foot: 95 }, arm: { u: 180, f: 180 } },
    B: { hip: [160, 74], torso: 0, leg: { a: [162, 142], foot: 125 }, leg2: { a: [156, 142], foot: 125 }, arm: { u: 180, f: 180 } },
  },

  /* ===================== כתפיים ===================== */
  'overhead-press': {
    equip: 'barbell', hl: ['delt'], zoom: 0.8,
    A: st({ arm: { w: [172, 44] } }), B: st({ arm: { w: [163, -14] } }),
  },
  'db-shoulder-press': {
    equip: 'dumbbell', hl: ['delt'], zoom: 0.88, props: [...SEAT_PROPS, ...BACKREST],
    A: { ...SEAT, arm: { w: [162, 66], b: 1 } }, B: { ...SEAT, arm: { w: [154, 10] } },
  },
  'lateral-raise': {
    equip: 'dumbbell', hl: ['delt'],
    A: { front: true, hipY: 92, shY: 42, arm: { u: 170, f: 172 }, leg: { t: 176, s: 180 } },
    B: { front: true, hipY: 92, shY: 42, arm: { u: 92, f: 98 }, leg: { t: 176, s: 180 } },
  },
  'cable-lateral-raise': {
    equip: 'handle', hl: ['delt'], cable: [92, 156], props: [{ l: [[86, 30], [86, 160]], w: 6 }],
    A: { front: true, hipY: 92, shY: 42, arm: { u: 200, f: 200 }, armL: { u: -160, f: -120 }, leg: { t: 176, s: 180 } },
    B: { front: true, hipY: 92, shY: 42, arm: { u: 95, f: 98 }, armL: { u: -160, f: -120 }, leg: { t: 176, s: 180 } },
    cableL: [86, 74],
  },
  'front-raise': {
    equip: 'dumbbell', hl: ['delt'],
    A: st({ arm: { u: 176, f: 176 } }), B: st({ arm: { u: 92, f: 88 } }),
  },
  'rear-delt-fly': {
    equip: 'dumbbell', hl: ['delt'],
    A: { front: true, hipY: 96, shY: 76, headY: 70, arm: { u: 178, f: 180 }, leg: { t: 172, s: 186 } },
    B: { front: true, hipY: 96, shY: 76, headY: 70, arm: { u: 100, f: 104 }, leg: { t: 172, s: 186 } },
  },
  'face-pull': {
    equip: 'rope', hl: ['delt'], cable: [272, 38], props: [{ l: [[272, 20], [272, 160]], w: 6 }],
    A: st({ torso: -6, arm: { w: [214, 40] } }), B: st({ torso: -6, arm: { w: [172, 28], b: -1 } }),
  },
  'upright-row': {
    equip: 'barbell', hl: ['delt'], plate: 11,
    A: st({ arm: { w: [166, 96] } }), B: st({ arm: { w: [170, 46], b: -1 } }),
  },
  shrugs: {
    equip: 'dumbbell', hl: ['traps'],
    A: { front: true, hipY: 92, shY: 44, headY: 23, arm: { u: 178, f: 180 }, leg: { t: 176, s: 180 } },
    B: { front: true, hipY: 92, shY: 35, headY: 22, arm: { u: 178, f: 180 }, leg: { t: 176, s: 180 } },
  },

  /* ===================== יד קדמית ===================== */
  'barbell-curl': {
    equip: 'barbell', hl: ['ua'], plate: 11,
    A: st({ arm: { u: 178, f: 178 } }), B: st({ arm: { u: 172, f: 22 } }),
  },
  'db-curl': {
    equip: 'dumbbell', hl: ['ua'],
    A: st({ arm: { u: 180, f: 180 } }), B: st({ arm: { u: 172, f: 18 } }),
  },
  'hammer-curl': {
    equip: 'hammer', hl: ['ua'],
    A: st({ arm: { u: 180, f: 180 } }), B: st({ arm: { u: 172, f: 22 } }),
  },
  'incline-db-curl': {
    equip: 'dumbbell', hl: ['ua'], props: INCL_PROPS,
    A: { ...INCL, arm: { u: 182, f: 182 } }, B: { ...INCL, arm: { u: 180, f: 40 } },
  },
  'preacher-curl': {
    equip: 'barbell', hl: ['ua'], plate: 10,
    props: [{ r: [120, 118, 46, 8] }, { l: [[143, 126], [143, 160]] }, { l: [[170, 66], [194, 100]], w: 10 }, { l: [[184, 92], [184, 160]] }],
    A: { ...SEAT, hip: [146, 114], torso: 6, arm: { u: 140, f: 150 } },
    B: { ...SEAT, hip: [146, 114], torso: 6, arm: { u: 140, f: -10 } },
  },
  'cable-curl': {
    equip: 'bar', hl: ['ua'], cable: [236, 154], props: [{ l: [[240, 80], [240, 160]], w: 6 }],
    A: st({ arm: { u: 178, f: 172 } }), B: st({ arm: { u: 172, f: 20 } }),
  },
  'concentration-curl': {
    equip: 'dumbbell', hl: ['ua'], props: SEAT_PROPS,
    A: { ...SEAT, torso: 38, leg: { t: 92, s: 178 }, arm: { u: 172, f: 178 } },
    B: { ...SEAT, torso: 38, leg: { t: 92, s: 178 }, arm: { u: 172, f: -30 } },
  },

  /* ===================== יד אחורית ===================== */
  'triceps-pushdown': {
    equip: 'bar', hl: ['ua'], cable: [214, 8], props: [{ l: [[214, 4], [214, 160]], w: 6 }],
    A: st({ torso: 10, arm: { u: 170, f: 38 } }), B: st({ torso: 10, arm: { u: 170, f: 178 } }),
  },
  'rope-pushdown': {
    equip: 'rope', hl: ['ua'], cable: [214, 8], props: [{ l: [[214, 4], [214, 160]], w: 6 }],
    A: st({ torso: 10, arm: { u: 170, f: 38 } }), B: st({ torso: 10, arm: { u: 170, f: 190 } }),
  },
  'skull-crusher': {
    equip: 'barbell', hl: ['ua'], plate: 10, props: BENCH,
    A: ly({ u: -14, f: -10 }), B: ly({ u: -18, f: -125 }),
  },
  'overhead-extension': {
    equip: 'dumbbell', hl: ['ua'], zoom: 0.86,
    A: st({ arm: { u: -8, f: 205 } }), B: st({ arm: { u: -8, f: -6 } }),
  },
  'close-grip-bench': {
    equip: 'barbell', hl: ['ua'], props: BENCH,
    A: ly({ w: [144, 52] }), B: ly({ w: [156, 96] }),
  },
  'triceps-dips': {
    hl: ['ua'], props: DIPS,
    A: { hip: [166, 84], torso: 0, arm: { w: [167, 84] }, leg: { t: 182, s: 228 }, leg2: { t: 176, s: 222 } },
    B: { hip: [164, 108], torso: 4, arm: { w: [167, 84], b: -1 }, leg: { t: 182, s: 228 }, leg2: { t: 176, s: 222 } },
  },
  kickback: {
    equip: 'dumbbell', hl: ['ua'],
    props: [{ r: [190, 118, 75, 8] }, { l: [[205, 126], [205, 160]] }, { l: [[255, 126], [255, 160]] }],
    A: { hip: [140, 106], torso: 80, leg: { a: [150, 160] }, arm: { u: -112, f: 180 }, arm2: { w: [222, 118] } },
    B: { hip: [140, 106], torso: 80, leg: { a: [150, 160] }, arm: { u: -112, f: -100 }, arm2: { w: [222, 118] } },
  },
}
