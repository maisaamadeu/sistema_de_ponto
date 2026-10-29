import type { DayOverride, TimeEntry, WorkDay, WorkSchedule } from '@/domain/entities'

import { classifyDayKind } from './classify-day'
import { CalculationError, err, ok, type CalculationResult } from './errors'
import { deriveExpectedDailyMinutes, isScheduledWorkday } from './schedule'
import { buildWorkSessions, sumWorkedMinutes } from './sessions'
import { assertDateKey } from './time-math'

function asCalculationError(error: unknown): CalculationError {
  if (error instanceof CalculationError) return error
  return new CalculationError(
    'INVALID_TIME',
    error instanceof Error ? error.message : 'Erro de cálculo',
  )
}

export interface CalculateWorkDayInput {
  userId: string
  dateKey: string
  schedule: WorkSchedule
  entries: TimeEntry[]
  override?: DayOverride | null
  /**
   * Snapshot anterior do mesmo dia. Quando `expectedFrozen` é true,
   * a carga esperada histórica é preservada mesmo se a escala mudou.
   */
  previous?: Pick<WorkDay, 'expectedMinutes' | 'expectedFrozen'> | null
  /** Referência temporal para sessões ainda abertas. */
  asOfIso?: string
}

function resolveExpectedMinutes(input: {
  dateKey: string
  schedule: WorkSchedule
  override?: DayOverride | null
  previous?: Pick<WorkDay, 'expectedMinutes' | 'expectedFrozen'> | null
  hasEntries: boolean
}): number {
  const { dateKey, schedule, override, previous, hasEntries } = input

  if (previous?.expectedFrozen) {
    return previous.expectedMinutes
  }

  // Dias já materializados com registros preservam a carga histórica.
  if (previous && hasEntries) {
    return previous.expectedMinutes
  }

  if (override) {
    if (override.kind === 'confirmed_absence') {
      return deriveExpectedDailyMinutes(schedule)
    }
    // descanso, folga, férias, feriado, abono → sem carga esperada
    return 0
  }

  if (!isScheduledWorkday(schedule, dateKey)) {
    return 0
  }

  return deriveExpectedDailyMinutes(schedule)
}

function resolveBalanceMinutes(input: {
  kind: WorkDay['kind']
  workedMinutes: number
  expectedMinutes: number
}): number {
  const { kind, workedMinutes, expectedMinutes } = input

  switch (kind) {
    case 'no_records':
      // Regra explícita: dia sem registros não gera débito automático.
      return 0
    case 'rest':
    case 'day_off':
    case 'vacation':
    case 'holiday':
    case 'excused':
      return 0
    case 'confirmed_absence':
      return workedMinutes - expectedMinutes
    case 'complete':
    case 'incomplete':
      return workedMinutes - expectedMinutes
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

/**
 * Calcula o WorkDay de uma data lógica em minutos inteiros.
 */
export function calculateWorkDay(
  input: CalculateWorkDayInput,
): CalculationResult<WorkDay> {
  try {
    assertDateKey(input.dateKey)
  } catch (error) {
    return err(asCalculationError(error))
  }

  const dayEntries = input.entries.filter(
    (entry) => entry.dateKey === input.dateKey && entry.userId === input.userId,
  )

  const sessionsResult = buildWorkSessions(dayEntries, input.asOfIso)
  if (!sessionsResult.ok) return sessionsResult

  const sessions = sessionsResult.value
  const hasEntries = dayEntries.length > 0
  const workedMinutes = sumWorkedMinutes(sessions)

  const kind = classifyDayKind({
    dateKey: input.dateKey,
    schedule: input.schedule,
    override: input.override,
    sessions,
    hasEntries,
  })

  let expectedMinutes: number
  try {
    expectedMinutes = resolveExpectedMinutes({
      dateKey: input.dateKey,
      schedule: input.schedule,
      override: input.override,
      previous: input.previous,
      hasEntries,
    })
  } catch (error) {
    return err(asCalculationError(error))
  }

  const balanceMinutes = resolveBalanceMinutes({
    kind,
    workedMinutes,
    expectedMinutes,
  })

  const expectedFrozen =
    Boolean(input.previous?.expectedFrozen) || hasEntries || kind === 'confirmed_absence'

  return ok({
    userId: input.userId,
    dateKey: input.dateKey,
    kind,
    expectedMinutes,
    workedMinutes,
    balanceMinutes,
    entryIds: dayEntries.map((entry) => entry.id),
    overrideId: input.override?.id,
    expectedFrozen,
  })
}
