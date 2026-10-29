import { useCallback, useEffect, useState } from 'react'

import type { GuestSession } from '@/infrastructure/persistence/dexie'
import { useDependencies } from '@/hooks/use-dependencies'
import type { AppDependencies } from '@/infrastructure/di/container'

export interface GuestSessionState {
  session: (GuestSession & { deps: AppDependencies }) | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useGuestSession(): GuestSessionState {
  const deps = useDependencies()
  const [session, setSession] = useState<
    (GuestSession & { deps: AppDependencies }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await deps.ensureGuestSession()
      setSession({ ...next, deps })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar sessão local')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [deps])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const next = await deps.ensureGuestSession()
        if (cancelled) return
        setSession({ ...next, deps })
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Falha ao carregar sessão local')
        setSession(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [deps])

  return { session, loading, error, refresh }
}
