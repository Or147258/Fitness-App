import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { pushSoon, useSyncStatus } from '../lib/sync'

/** שולח את ה-outbox כשתיים שניות עברו מהשינוי האחרון */
export function useAutoSync() {
  const outboxLen = useStore((s) => s.outbox.length)
  const user = useSyncStatus((s) => s.user)
  useEffect(() => {
    if (!user || !outboxLen) return
    const t = setTimeout(pushSoon, 2000)
    return () => clearTimeout(t)
  }, [outboxLen, user])
}
