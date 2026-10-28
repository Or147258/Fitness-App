import { useEffect } from 'react'

/** משאיר את המסך דלוק בזמן אימון (נתמך בכרום ובספארי 16.4+) */
export function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let lock = null
    const request = async () => {
      try { lock = await navigator.wakeLock.request('screen') } catch { /* ignore */ }
    }
    const onVisible = () => document.visibilityState === 'visible' && request()
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [enabled])
}
