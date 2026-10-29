import { calculateWorkDay } from '@/domain/calculation'
import { CalculationError } from '@/domain/calculation/errors'
import { PersistenceError } from '@/domain/errors/repository-error'

import { toDayOverride, toTimeEntry, toWorkSchedule } from './mappers'
import type { PontoDatabase, WorkDayRecord } from './ponto-db'

export interface RecalculateWorkDayOptions {
  asOfIso?: string
  /**
   * Quando true, sequências inválidas apenas removem o WorkDay materializado
   * (útil em exclusões parciais). Quando false, propaga o erro.
   */
  softInvalidSequence?: boolean
}

/**
 * Rematerializa o WorkDay de uma data dentro de uma transação já aberta.
 * Remove o materializado quando não há marcações nem override.
 */
export async function recalculateWorkDayInTransaction(
  db: PontoDatabase,
  userId: string,
  dateKey: string,
  options: RecalculateWorkDayOptions = {},
): Promise<WorkDayRecord | null> {
  const { asOfIso, softInvalidSequence = false } = options
  const [entries, override, previous, schedules] = await Promise.all([
    db.timeEntries
      .where('[userId+dateKey]')
      .equals([userId, dateKey])
      .sortBy('occurredAt'),
    db.dayOverrides.where('[userId+dateKey]').equals([userId, dateKey]).first(),
    db.workDays.where('[userId+dateKey]').equals([userId, dateKey]).first(),
    db.schedules.where('userId').equals(userId).sortBy('effectiveFrom'),
  ])

  const scheduleRecord = [...schedules]
    .reverse()
    .find((item) => item.effectiveFrom <= dateKey)

  const shouldMaterialize = entries.length > 0 || Boolean(override)

  if (!scheduleRecord || !shouldMaterialize) {
    if (previous) {
      await db.workDays.delete(previous.id)
    }
    return null
  }

  const result = calculateWorkDay({
    userId,
    dateKey,
    schedule: toWorkSchedule(scheduleRecord),
    entries: entries.map(toTimeEntry),
    override: override ? toDayOverride(override) : null,
    previous: previous
      ? {
          id: previous.id,
          expectedMinutes: previous.expectedMinutes,
          expectedFrozen: previous.expectedFrozen,
          createdAt: previous.createdAt,
        }
      : null,
    asOfIso,
  })

  if (!result.ok) {
    if (softInvalidSequence) {
      if (previous) {
        await db.workDays.delete(previous.id)
      }
      return null
    }
    throw new PersistenceError(
      result.error instanceof CalculationError
        ? result.error.message
        : 'Falha ao recalcular jornada do dia',
      { cause: result.error },
    )
  }

  const workDay = result.value
  const record: WorkDayRecord = {
    id: workDay.id,
    userId: workDay.userId,
    dateKey: workDay.dateKey,
    kind: workDay.kind,
    expectedMinutes: workDay.expectedMinutes,
    workedMinutes: workDay.workedMinutes,
    balanceMinutes: workDay.balanceMinutes,
    entryIds: [...workDay.entryIds],
    overrideId: workDay.overrideId,
    expectedFrozen: workDay.expectedFrozen,
    createdAt: workDay.createdAt,
    updatedAt: workDay.updatedAt,
  }

  await db.workDays.put(record)
  return record
}
