import type { UserPreferences, WorkSchedule } from '@/domain/entities'
import type {
  UserPreferencesRepository,
  WorkScheduleRepository,
} from '@/domain/repositories'

import { buildCreateWorkScheduleInput, localDateKey } from './build-work-schedule'
import type { WorkScheduleFormValues } from './schedule-schema'

export interface PublishWorkScheduleResult {
  schedule: WorkSchedule
  preferences: UserPreferences
  /** true quando uma nova versão foi criada (e não o primeiro onboarding). */
  createdNewVersion: boolean
  previousSchedule: WorkSchedule | null
}

/**
 * Persiste preferências e cria uma nova versão de jornada.
 * Nunca sobrescreve escalas antigas — o histórico permanece para `getEffectiveOn`.
 */
export async function publishWorkSchedule(input: {
  userId: string
  values: WorkScheduleFormValues
  schedules: WorkScheduleRepository
  preferences: UserPreferencesRepository
  /** Marca onboarding como concluído. */
  completeOnboarding?: boolean
  effectiveFrom?: string
  nowIso?: string
}): Promise<PublishWorkScheduleResult> {
  const effectiveFrom = input.effectiveFrom ?? localDateKey()
  const nowIso = input.nowIso ?? new Date().toISOString()

  const existing = await input.schedules.listByUserId(input.userId)
  const previousSchedule =
    [...existing].reverse().find((row) => row.effectiveFrom <= effectiveFrom) ??
    existing.at(-1) ??
    null

  const schedule = await input.schedules.create(
    buildCreateWorkScheduleInput({
      userId: input.userId,
      values: input.values,
      effectiveFrom,
    }),
  )

  const currentPrefs = await input.preferences.getByUserId(input.userId)
  const preferences = currentPrefs
    ? await input.preferences.update(input.userId, {
        theme: input.values.theme,
        weekStartsOn: input.values.weekStartsOn,
        absencePolicy: input.values.absencePolicy,
        ...(input.completeOnboarding ? { onboardingCompletedAt: nowIso } : {}),
      })
    : await input.preferences.save({
        userId: input.userId,
        theme: input.values.theme,
        weekStartsOn: input.values.weekStartsOn,
        absencePolicy: input.values.absencePolicy,
        onboardingCompletedAt: input.completeOnboarding ? nowIso : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      })

  return {
    schedule,
    preferences,
    createdNewVersion: existing.length > 0,
    previousSchedule,
  }
}
