// מייצר public/exercises/<id>.svg לכל תרגיל מובנה.  הרצה: npm run art
// עם --preview נוצר גם קובץ HTML לבדיקה עם פריים התחלה וסיום של כל תרגיל.
import { mkdirSync, writeFileSync } from 'node:fs'
import { BUILTIN_EXERCISES } from '../src/data/exercises.js'
import { POSES } from './poses.mjs'
import { buildSvg } from './figure.mjs'

const outDir = new URL('../public/exercises/', import.meta.url)
mkdirSync(outDir, { recursive: true })

const missing = []
let html = '<html dir="rtl"><body style="background:#000;color:#ccc;font:12px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px">'
for (const ex of BUILTIN_EXERCISES) {
  const pose = POSES[ex.id]
  if (!pose) { missing.push(ex.id); continue }
  const spec = { ...pose, muscle: ex.muscle }
  writeFileSync(new URL(`${ex.id}.svg`, outDir), buildSvg(spec))
  if (process.argv.includes('--preview')) {
    const a = buildSvg(spec, { frameT: 0 }).replace('width="640" height="360"', 'width="150" height="84"')
    const b = buildSvg(spec, { frameT: 1 }).replace('width="640" height="360"', 'width="150" height="84"')
    html += `<div>${a}${b}<div>${ex.name} · ${ex.id}</div></div>`
  }
}
if (process.argv.includes('--preview')) writeFileSync(process.argv.at(-1), html + '</body></html>')
if (missing.length) { console.error('חסרות תנוחות:', missing); process.exit(1) }
console.log(`נוצרו ${BUILTIN_EXERCISES.length} איורים`)
