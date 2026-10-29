import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useGuestSession } from '@/hooks/use-guest-session'

/**
 * Redireciona para /onboarding no primeiro acesso (sem onboardingCompletedAt).
 * A rota de onboarding fica fora do AppShell.
 */
export function OnboardingGate() {
  const { session, loading, error } = useGuestSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--ground)] px-4">
        <p className="text-sm text-[var(--muted)]">Carregando Ponto Fácil…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--ground)] px-4">
        <p className="max-w-md text-center text-sm text-[var(--negative)]" role="alert">
          {error}
        </p>
      </div>
    )
  }

  const needsOnboarding = !session?.preferences.onboardingCompletedAt
  const onOnboarding = location.pathname.startsWith('/onboarding')

  if (needsOnboarding && !onOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  if (!needsOnboarding && onOnboarding) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
