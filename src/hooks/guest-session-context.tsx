import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { GuestSession } from '@/infrastructure/persistence/dexie'
import { useDependencies } from '@/hooks/use-dependencies'
import type { AppDependencies } from '@/infrastructure/di/container'

export type GuestSessionValue = GuestSession & { deps: AppDependencies }

interface GuestSessionContextValue {
  session: GuestSessionValue | null
  loading: boolean
  error: string | null
  refresh: () => Promise<GuestSessionValue | null>
}

const GuestSessionContext = createContext<GuestSessionContextValue | null>(null)

export function GuestSessionProvider({ children }: { children: ReactNode }) {
  const deps = useDependencies()
  const [session, setSession] = useState<GuestSessionValue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // Soft refresh: não zera a UI se já há sessão (evita desmontar o Outlet).
    setError(null)
    const hadSession = session !== null
    if (!hadSession) setLoading(true)
    try {
      const next = await deps.ensureGuestSession()
      const value = { ...next, deps }
      setSession(value)
      return value
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar sessão local')
      if (!hadSession) setSession(null)
      return null
    } finally {
      if (!hadSession) setLoading(false)
    }
  }, [deps, session])

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

  const value = useMemo(
    () => ({ session, loading, error, refresh }),
    [session, loading, error, refresh],
  )

  return (
    <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>
  )
}

export function useGuestSession(): GuestSessionContextValue {
  const context = useContext(GuestSessionContext)
  if (!context) {
    throw new Error('useGuestSession deve ser usado dentro de GuestSessionProvider')
  }
  return context
}
