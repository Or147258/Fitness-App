// מנוע איורים: דמות מקלות מונפשת (SVG + SMIL) לכל תרגיל.
// כל תרגיל מוגדר כשתי תנוחות (A=התחלה, B=סוף); המנוע מחשב קינמטיקה, מחבר ביניהן ומייצר אנימציה בלולאה.

export const L = { torso: 50, neck: 17, head: 9, ua: 28, fa: 27, th: 36, sh: 35, ft: 11 }
const rad = (d) => (d * Math.PI) / 180
export const dir = (a) => [Math.sin(rad(a)), -Math.cos(rad(a))] // 0=למעלה, 90=ימינה, 180=למטה
const add = (p, a, l) => [p[0] + dir(a)[0] * l, p[1] + dir(a)[1] * l]
const angleOf = (p, q) => {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  return (Math.atan2(dx, -dy) * 180) / Math.PI
}

/** IK דו-מפרקי: מחזיר [מפרק אמצעי, קצה] */
function ik(P, T, a, b, bend) {
  let d = Math.hypot(T[0] - P[0], T[1] - P[1])
  d = Math.min(Math.max(d, Math.abs(a - b) + 0.5), a + b - 0.01)
  const th = Math.atan2(T[1] - P[1], T[0] - P[0])
  const al = Math.acos((a * a + d * d - b * b) / (2 * a * d))
  const ang = th + bend * al
  const J = [P[0] + a * Math.cos(ang), P[1] + a * Math.sin(ang)]
  const e = Math.atan2(T[1] - J[1], T[0] - J[0])
  return [J, [J[0] + b * Math.cos(e), J[1] + b * Math.sin(e)]]
}

function limb(base, spec, l1, l2, ref, joints) {
  if (spec.w || spec.wS || spec.wH) {
    const T = spec.w ?? (spec.wS ? [joints.S[0] + spec.wS[0], joints.S[1] + spec.wS[1]] : [joints.H[0] + spec.wH[0], joints.H[1] + spec.wH[1]])
    return ik(base, T, l1, l2, spec.b ?? 1)
  }
  if (spec.a) return ik(base, spec.a, l1, l2, spec.b ?? -1)
  const r = spec.rel ? ref : 0
  const J = add(base, (spec.u ?? spec.t) + r, l1)
  return [J, add(J, (spec.f ?? spec.s) + r, l2)]
}

/** פותר תנוחה → נקודות */
export function solve(p) {
  if (p.front) return solveFront(p)
  const H = p.hip
  const S = add(H, p.torso, L.torso)
  const head = add(S, p.torso + (p.headTilt ?? 0), L.neck)
  const j = { H, S, head, T: p.torso }
  for (const k of ['arm', 'arm2']) if (p[k]) [j[k + 'E'], j[k + 'W']] = limb(S, p[k], L.ua, L.fa, p.torso, j)
  for (const k of ['leg', 'leg2'])
    if (p[k]) {
      ;[j[k + 'K'], j[k + 'A']] = limb(H, p[k], L.th, L.sh, p.torso, j)
      const fa = p[k].foot ?? (p[k].a ? 90 : angleOf(j[k + 'K'], j[k + 'A']) - 90)
      j[k + 'F'] = add(j[k + 'A'], fa, L.ft)
    }
  return j
}

function solveFront(p) {
  const cx = 160
  const j = { front: true, cx, hipY: p.hipY, shY: p.shY, head: [cx, p.headY ?? p.shY - 19] }
  const sides = [['R', 1], ['L', -1]]
  for (const [s, m] of sides) {
    const arm = s === 'L' && p.armL ? p.armL : p.arm
    const S = [cx + m * 15, p.shY]
    j['S' + s] = S
    const am = s === 'L' && p.armL ? 1 : m
    const E = add(S, am * arm.u, L.ua)
    j['E' + s] = E
    j['W' + s] = add(E, am * arm.f, L.fa)
    const H = [cx + m * 8, p.hipY]
    j['H' + s] = H
    const K = add(H, m * p.leg.t, L.th)
    j['K' + s] = K
    j['A' + s] = add(K, m * p.leg.s, L.sh)
    j['F' + s] = add(j['A' + s], m * 90, 6)
  }
  return j
}

/* ---------- ציור ---------- */
const C = {
  body: '#e8e8ec',
  back: '#6b7080',
  equip: '#a1a1aa',
  plate: '#3a3f4a',
  prop: '#2b3039',
  propEdge: '#3d434f',
}
export const MUSCLE_COLOR = {
  chest: '#fb7185', back: '#38bdf8', legs: '#fbbf24', shoulders: '#a78bfa', biceps: '#a3e635', triceps: '#2dd4bf',
}

const f1 = (n) => Math.round(n * 10) / 10
const pth = (...pts) => 'M' + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(' L')
const lerpPt = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** רשימת אלמנטים במבנה קבוע לכל פריים (כדי שאפשר להנפיש ביניהם) */
function draw(j, spec) {
  const col = MUSCLE_COLOR[spec.muscle]
  const els = []
  const seg = (id, d, color, w) => els.push({ id, tag: 'path', a: { d }, s: { stroke: color, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } })
  const dot = (id, c, r, fill, extra = {}) => els.push({ id, tag: 'circle', a: { cx: f1(c[0]), cy: f1(c[1]), r }, s: { fill, ...extra } })
  const hl = new Set(spec.hl ?? [])

  if (j.front) {
    for (const s of ['L', 'R']) {
      seg('leg' + s, pth(j['H' + s], j['K' + s], j['A' + s], j['F' + s]), C.body, 8)
      if (hl.has('th')) seg('legh' + s, pth(j['H' + s], j['K' + s]), col, 8)
    }
    seg('hips', pth(j.HL, j.HR), C.body, 10)
    seg('torso', pth([j.cx, j.hipY - 2], [j.cx, j.shY + 2]), hl.has('torso') ? col : C.body, 16)
    seg('shoulders', pth(j.SL, j.SR), hl.has('traps') ? col : C.body, 10)
    for (const s of ['L', 'R']) {
      seg('arm' + s, pth(j['S' + s], j['E' + s], j['W' + s]), C.body, 7.5)
      if (hl.has('ua')) seg('armh' + s, pth(j['S' + s], j['E' + s]), col, 7.5)
      if (hl.has('delt')) dot('delt' + s, j['S' + s], 6, col)
    }
    dot('head', j.head, L.head, C.body)
    for (const s of ['L', 'R']) equip(els, spec, j['W' + s], angleOf(j['E' + s], j['W' + s]), j, s)
    return els
  }

  const ink = (k) => (k.endsWith('2') ? C.back : C.body)
  // רגל/יד אחורית קודם
  for (const k of ['leg2', 'arm2']) {
    if (k === 'leg2' && j.leg2K) seg(k, pth(j.H, j.leg2K, j.leg2A, j.leg2F), C.back, 8)
    if (k === 'arm2' && j.arm2E) seg(k, pth(j.S, j.arm2E, j.arm2W), C.back, 7.5)
  }
  if (j.legK) {
    seg('lego', pth(j.H, j.legK, j.legA, j.legF), '#14171c', 12)
    seg('leg', pth(j.H, j.legK, j.legA, j.legF), ink('leg'), 8.5)
    if (hl.has('th')) seg('legh', pth(j.H, j.legK), col, 8.5)
    if (hl.has('sh')) seg('shinh', pth(j.legK, j.legA), col, 8.5)
  }
  seg('torso', pth(j.H, j.S), hl.has('torso') ? col : C.body, 13)
  if (hl.has('chest')) {
    // חזה: מקטע קדמי בחלק העליון של הגו
    const n = dir(j.T + 90)
    const a = lerpPt(j.H, j.S, 0.55)
    const b = lerpPt(j.H, j.S, 0.88)
    seg('chest', pth([a[0] + n[0] * 3, a[1] + n[1] * 3], [b[0] + n[0] * 3, b[1] + n[1] * 3]), col, 9)
  }
  if (hl.has('lowback')) seg('lowback', pth(j.H, lerpPt(j.H, j.S, 0.5)), col, 13)
  dot('neck', lerpPt(j.S, j.head, 0.35), 4, C.body)
  dot('head', j.head, L.head, C.body)
  if (j.armE) {
    seg('armo', pth(j.S, j.armE, j.armW), '#14171c', 11)
    seg('arm', pth(j.S, j.armE, j.armW), C.body, 7.5)
    if (hl.has('ua')) seg('armh', pth(j.S, j.armE), col, 7.5)
  }
  if (hl.has('delt')) dot('delt', j.S, 6.5, col)
  if (j.armW) equip(els, spec, j.armW, angleOf(j.armE, j.armW), j, '')
  if (spec.equipAt) equip(els, spec, spec.equipAt(j), 0, j, 'x')
  return els
}

function equip(els, spec, W, faAngle, j, sfx) {
  const type = spec.equip
  if (!type) return
  const cable = (anchor) =>
    els.unshift({ id: 'cable' + sfx, tag: 'path', a: { d: pth(W, anchor) }, s: { stroke: C.equip, 'stroke-width': 1.6, fill: 'none', opacity: 0.8 } })
  if (spec.cable) cable(sfx === 'L' && spec.cableL ? spec.cableL : spec.cable)
  const id = 'eq' + sfx
  if (type === 'barbell') {
    els.push({ id, tag: 'circle', a: { cx: f1(W[0]), cy: f1(W[1]), r: spec.plate ?? 13 }, s: { fill: C.plate, stroke: C.equip, 'stroke-width': 2 } })
    els.push({ id: id + 'c', tag: 'circle', a: { cx: f1(W[0]), cy: f1(W[1]), r: 2.5 }, s: { fill: C.equip } })
  } else if (type === 'dumbbell') {
    els.push({ id, tag: 'circle', a: { cx: f1(W[0]), cy: f1(W[1]), r: 6.5 }, s: { fill: C.plate, stroke: C.equip, 'stroke-width': 2 } })
  } else if (type === 'hammer' || type === 'bar') {
    // משקולת/ידית לאורך הכיוון (ניצב לאמה)
    const a = faAngle + (type === 'hammer' ? 0 : 90)
    const half = type === 'hammer' ? 9 : 10
    els.push({ id, tag: 'path', a: { d: pth(add(W, a, -half), add(W, a, half)) }, s: { stroke: C.equip, 'stroke-width': type === 'hammer' ? 6 : 4, 'stroke-linecap': 'round', fill: 'none' } })
  } else if (type === 'handle') {
    els.push({ id, tag: 'circle', a: { cx: f1(W[0]), cy: f1(W[1]), r: 4 }, s: { fill: 'none', stroke: C.equip, 'stroke-width': 2.5 } })
  } else if (type === 'rope') {
    els.push({ id, tag: 'path', a: { d: pth(W, add(W, faAngle + 15, 11)) + pth(W, add(W, faAngle - 15, 11)).replace('M', ' M') }, s: { stroke: '#d4b483', 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none' } })
  } else if (type === 'platform') {
    // פלטפורמה ברגליים (לחיצת רגליים) — במיקום הכף
    const A = j.legF ? lerpPt(j.legA, j.legF, 0.6) : W
    els.push({ id, tag: 'path', a: { d: pth(add(A, 135, 20), add(A, -45, 20)) }, s: { stroke: C.propEdge, 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' } })
  } else if (type === 'roller') {
    const A = j.legA
    els.push({ id, tag: 'circle', a: { cx: f1(A[0]), cy: f1(A[1] + (spec.rollerDy ?? 0)), r: 6.5 }, s: { fill: C.propEdge } })
  }
}

/* ---------- פרופס סטטיים ---------- */
function props(list = []) {
  return list
    .map((p) => {
      if (p.r) return `<rect x="${p.r[0]}" y="${p.r[1]}" width="${p.r[2]}" height="${p.r[3]}" rx="${p.rx ?? 3}" fill="${p.fill ?? C.prop}" stroke="${C.propEdge}" stroke-width="1.5"${p.rot ? ` transform="rotate(${p.rot} ${p.r[0]} ${p.r[1]})"` : ''}/>`
      if (p.l) return `<path d="${pth(...p.l)}" stroke="${p.c ?? C.propEdge}" stroke-width="${p.w ?? 5}" stroke-linecap="round" fill="none"/>`
      if (p.c) return `<circle cx="${p.c[0]}" cy="${p.c[1]}" r="${p.c[2]}" fill="${C.propEdge}"/>`
      return ''
    })
    .join('')
}

/* ---------- אינטרפולציה ---------- */
function lerp(a, b, t) {
  if (typeof a === 'number') return a + (b - a) * t
  if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i], t))
  if (a && typeof a === 'object') {
    const o = {}
    for (const k of Object.keys(a)) o[k] = b && k in b ? lerp(a[k], b[k], t) : a[k]
    return o
  }
  return a
}
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t)

const attrStr = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ')

/** בונה SVG מונפש מלא */
export function buildSvg(spec, { animate = true, frameT = null } = {}) {
  const N = 10
  let ts
  if (frameT != null) ts = [frameT]
  else if (!animate) ts = [0]
  else {
    const up = Array.from({ length: N + 1 }, (_, i) => ease(i / N))
    ts = [0, ...up, 1, ...up.slice().reverse().slice(1), 0] // החזקה קצרה בכל קצה
  }
  const frames = ts.map((t) => draw(solve(lerp(spec.A, spec.B, t)), spec))
  const base = frames[0]
  const col = MUSCLE_COLOR[spec.muscle]
  const dur = spec.dur ?? 2.8
  const z = spec.zoom ?? 1

  const body = base
    .map((el, i) => {
      const anims = Object.keys(el.a)
        .map((k) => {
          const vals = frames.map((fr) => fr[i]?.a[k])
          if (vals.every((v) => v === vals[0])) return ''
          return `<animate attributeName="${k}" dur="${dur}s" repeatCount="indefinite" values="${vals.join(';')}"/>`
        })
        .join('')
      const open = `<${el.tag} ${attrStr(el.a)} ${attrStr(el.s)}`
      return anims ? `${open}>${anims}</${el.tag}>` : `${open}/>`
    })
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="640" height="360">
<defs><radialGradient id="g" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient></defs>
<rect width="320" height="180" fill="#14171c"/><rect width="320" height="180" fill="url(#g)"/>
<g transform="translate(160 162) scale(${z}) translate(-160 -162)">
<path d="M-200 162 H520" stroke="#2b3039" stroke-width="2"/>
${props(spec.props)}
${body}
</g>
</svg>`
}
