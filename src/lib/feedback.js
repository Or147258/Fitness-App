// צליל ורטט בסיום מנוחה. ב-iOS צריך "להפעיל" את האודיו מתוך לחיצה של המשתמש.
let ctx = null

export function primeAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
  } catch { /* אין תמיכה */ }
}

export function beep() {
  try {
    primeAudio()
    if (!ctx) return
    const t = ctx.currentTime
    ;[0, 0.18, 0.36].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 1320 : 880
      gain.gain.setValueAtTime(0.0001, t + offset)
      gain.gain.exponentialRampToValueAtTime(0.35, t + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + offset)
      osc.stop(t + offset + 0.16)
    })
  } catch { /* ignore */ }
}

export function vibrate(pattern = [200, 100, 200]) {
  try { navigator.vibrate?.(pattern) } catch { /* ignore */ }
}
