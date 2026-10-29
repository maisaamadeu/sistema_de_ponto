import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { WorkScheduleForm } from '@/features/settings/work-schedule-form'
import {
  defaultWorkScheduleFormValues,
  publishWorkSchedule,
  type WorkScheduleFormValues,
} from '@/domain/settings'
import { useGuestSession } from '@/hooks/use-guest-session'
import { useTheme } from '@/lib/theme/theme-provider'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session, loading, refresh } = useGuestSession()
  const { setPreference } = useTheme()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaults = useMemo(
    () =>
      defaultWorkScheduleFormValues({
        theme: session?.preferences.theme ?? 'system',
        absencePolicy: session?.preferences.absencePolicy ?? 'no_debit',
        weekStartsOn: session?.preferences.weekStartsOn ?? 1,
      }),
    [session],
  )

  if (loading && !session) {
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-[var(--muted)]">Preparando seu ponto…</p>
      </div>
    )
  }

  if (session?.preferences.onboardingCompletedAt) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(values: WorkScheduleFormValues) {
    if (!session) return
    setSubmitError(null)
    try {
      await publishWorkSchedule({
        userId: session.profile.id,
        values,
        schedules: session.deps.schedules,
        preferences: session.deps.preferences,
        completeOnboarding: true,
      })
      setPreference(values.theme)
      await refresh()
      navigate('/', { replace: true })
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a jornada. Tente de novo.',
      )
    }
  }

  return (
    <div className="min-h-svh bg-[var(--ground)] text-[var(--text)]">
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-8 space-y-3 border-b border-[var(--border)] pb-6">
          <p className="text-sm font-semibold tracking-tight text-[var(--accent)]">
            Ponto Fácil
          </p>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-balance lg:text-[2rem]">
            Defina sua jornada
          </h1>
          <p className="max-w-xl text-sm text-[var(--muted)] sm:text-base">
            No primeiro acesso, configure entrada, intervalo, saída e dias trabalhados.
            Depois você pode editar — cada mudança cria uma nova versão e preserva o
            histórico.
          </p>
        </header>

        <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
          <WorkScheduleForm
            defaultValues={defaults}
            submitLabel="Começar a usar"
            onSubmit={handleSubmit}
          />
          {submitError ? (
            <p className="mt-4 text-sm text-[var(--negative)]" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
