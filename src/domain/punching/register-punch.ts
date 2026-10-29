import type { PunchType, TimeEntry, WorkDay, WorkSchedule } from '@/domain/entities'
import type { AbsencePolicy } from '@/domain/entities'
import { calculateWorkDay } from '@/domain/calculation'
import type { TimeEntryRepository } from '@/domain/repositories'

import { isPunchTransitionAllowed } from './next-punch'

export interface RegisterPunchInput {
  userId: string
  dateKey: string
  type: PunchType
  occurredAt: string
  note?: string
  existingEntries: TimeEntry[]
  timeEntries: TimeEntryRepository
}

export interface RegisterPunchResult {
  entry: TimeEntry
  entries: TimeEntry[]
}

/**
 * Valida transição, persiste a marcação e só então devolve sucesso.
 * A rematerialização do WorkDay ocorre na transação do repositório.
 */
export async function registerPunch(
  input: RegisterPunchInput,
): Promise<RegisterPunchResult> {
  const allowed = isPunchTransitionAllowed(
    input.existingEntries,
    input.type,
    input.occurredAt,
  )
  if (!allowed.ok) {
    throw new Error(allowed.message)
  }

  const entry = await input.timeEntries.create({
    userId: input.userId,
    dateKey: input.dateKey,
    type: input.type,
    occurredAt: input.occurredAt,
    note: input.note,
  })

  const entries = await input.timeEntries.listByDate(input.dateKey, input.userId)
  return { entry, entries }
}

/**
 * Calcula o WorkDay “ao vivo” sem gravar — usa `asOfIso` para sessões abertas.
 */
export function calculateLiveWorkDay(input: {
  userId: string
  dateKey: string
  schedule: WorkSchedule
  entries: TimeEntry[]
  previous?: WorkDay | null
  absencePolicy?: AbsencePolicy
  asOfIso: string
}): WorkDay | null {
  const result = calculateWorkDay({
    userId: input.userId,
    dateKey: input.dateKey,
    schedule: input.schedule,
    entries: input.entries,
    previous: input.previous
      ? {
          id: input.previous.id,
          expectedMinutes: input.previous.expectedMinutes,
          expectedFrozen: input.previous.expectedFrozen,
          createdAt: input.previous.createdAt,
        }
      : null,
    absencePolicy: input.absencePolicy,
    asOfIso: input.asOfIso,
    nowIso: input.asOfIso,
  })

  return result.ok ? result.value : null
}
