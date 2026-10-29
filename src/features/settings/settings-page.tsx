import { useEffect, useMemo, useState } from 'react'

import { WorkScheduleForm } from '@/features/settings/work-schedule-form'
import {
  defaultWorkScheduleFormValues,
  formatMinutesAsHours,
  localDateKey,
  publishWorkSchedule,
  workScheduleToFormValues,
  WEEKDAY_LABELS,
  type WorkScheduleFormValues,
} from '@/domain/settings'
import { useGuestSession } from '@/hooks/use-guest-session'
import { useTheme } from '@/lib/theme/theme-provider'
import type { WorkSchedule } from '@/domain/entities'

function ScheduleVersionList({ versions }: { versions: WorkSchedule[] }) {
  if (versions.length === 0) return null

  const ordered = [...versions].sort((a, b) =>
    a.effectiveFrom < b.effectiveFrom ? 1 : a.effectiveFrom > b.effectiveFrom ? -1 : 0,
  )

  return (
    <section className="space-y-3" aria-labelledby="versions-title">
      <div>
        <h2 id="versions-title" className="text-lg font-semibold text-[var(--text)]">
          Versões da jornada
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Alterações criam uma versão nova. Dias anteriores usam a escala vigente naquela
          data.
        </p>
      </div>
      <ul className="divide-y divide-[var(--rule)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
        {ordered.map((version, index) => {
          const days = version.weekdays
            .map((day) => WEEKDAY_LABELS[day.weekday].slice(0, 3))
            .join(' · ')
          const load = formatMinutesAsHours(version.expectedDailyMinutes ?? 0)
          return (
            <li
              key={version.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text)]">
                  Vigente desde <span className="tabular">{version.effectiveFrom}</span>
                  {index === 0 ? (
                    <span className="ml-2 text-[var(--accent-ink)]">atual</span>
                  ) : null}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                  {days} · {load}/dia
                </p>
              </div>
              <p className="tabular text-xs text-[var(--muted)]">
                {version.mode === 'custom' ? 'Personalizada' : 'Seg–sex'}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function SettingsPage() {
  const { session, loading, refresh } = useGuestSession()
  const { setPreference } = useTheme()
  const [versions, setVersions] = useState<WorkSchedule[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    void session.deps.schedules.listByUserId(session.profile.id).then(setVersions)
  }, [session])

  const defaults = useMemo(() => {
    if (!session) return defaultWorkScheduleFormValues()
    if (session.schedule) {
      return workScheduleToFormValues(session.schedule, {
        theme: session.preferences.theme,
        absencePolicy: session.preferences.absencePolicy,
        weekStartsOn: session.preferences.weekStartsOn,
      })
    }
    return defaultWorkScheduleFormValues({
      theme: session.preferences.theme,
      absencePolicy: session.preferences.absencePolicy,
      weekStartsOn: session.preferences.weekStartsOn,
    })
  }, [session])

  async function handleSubmit(values: WorkScheduleFormValues) {
    if (!session) return
    setSubmitError(null)
    setStatus(null)
    try {
      const result = await publishWorkSchedule({
        userId: session.profile.id,
        values,
        schedules: session.deps.schedules,
        preferences: session.deps.preferences,
        completeOnboarding: !session.preferences.onboardingCompletedAt,
        effectiveFrom: localDateKey(),
      })
      setPreference(values.theme)
      const nextVersions = await session.deps.schedules.listByUserId(session.profile.id)
      setVersions(nextVersions)
      await refresh()
      setStatus(
        result.createdNewVersion
          ? 'Nova versão da jornada salva. O histórico dos dias anteriores foi preservado.'
          : 'Jornada salva neste navegador.',
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar as configurações. Tente de novo.',
      )
    }
  }

  if (loading || !session) {
    return (
      <section className="space-y-2" aria-labelledby="settings-title">
        <h1
          id="settings-title"
          className="text-[1.75rem] font-bold tracking-tight text-[var(--text)]"
        >
          Configurações
        </h1>
        <p className="text-sm text-[var(--muted)]">Carregando preferências…</p>
      </section>
    )
  }

  return (
    <section className="space-y-8" aria-labelledby="settings-title">
      <div className="space-y-1">
        <h1
          id="settings-title"
          className="text-[1.75rem] font-bold tracking-tight text-balance text-[var(--text)] lg:text-[2rem]"
        >
          Configurações
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Edite horários, dias trabalhados, tema e faltas. Cada mudança de jornada cria
          uma nova versão.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6">
        <WorkScheduleForm
          defaultValues={defaults}
          submitLabel="Salvar nova versão"
          onSubmit={handleSubmit}
        />
        <div aria-live="polite" className="mt-4 space-y-2">
          {status ? <p className="text-sm text-[var(--positive)]">{status}</p> : null}
          {submitError ? (
            <p className="text-sm text-[var(--negative)]" role="alert">
              {submitError}
            </p>
          ) : null}
        </div>
      </div>

      <ScheduleVersionList versions={versions} />
    </section>
  )
}
