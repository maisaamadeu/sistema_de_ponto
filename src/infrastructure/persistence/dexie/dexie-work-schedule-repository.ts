import { createStableId } from '@/domain/ids'
import { NotFoundError } from '@/domain/errors/repository-error'
import type {
  CreateWorkScheduleInput,
  UpdateWorkScheduleInput,
  WorkSchedule,
} from '@/domain/entities'
import type { WorkScheduleRepository } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { toWorkSchedule } from './mappers'
import { getPontoDatabase, type PontoDatabase, type WorkScheduleRecord } from './ponto-db'

export class DexieWorkScheduleRepository implements WorkScheduleRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  getById(id: string): Promise<WorkSchedule | null> {
    return withPersistence(async () => {
      const row = await this.db.schedules.get(id)
      return row ? toWorkSchedule(row) : null
    })
  }

  listByUserId(userId: string): Promise<WorkSchedule[]> {
    return withPersistence(async () => {
      const rows = await this.db.schedules
        .where('userId')
        .equals(userId)
        .sortBy('effectiveFrom')
      return rows.map(toWorkSchedule)
    })
  }

  getEffectiveOn(userId: string, dateKey: string): Promise<WorkSchedule | null> {
    return withPersistence(async () => {
      const rows = await this.db.schedules
        .where('userId')
        .equals(userId)
        .sortBy('effectiveFrom')
      const effective = [...rows].reverse().find((row) => row.effectiveFrom <= dateKey)
      return effective ? toWorkSchedule(effective) : null
    })
  }

  create(input: CreateWorkScheduleInput): Promise<WorkSchedule> {
    return withPersistence(async () => {
      const now = new Date().toISOString()
      const record: WorkScheduleRecord = {
        id: input.id ?? createStableId(),
        userId: input.userId,
        periods: input.periods.map((period) => ({ ...period })),
        workweekDays: [...input.workweekDays],
        timezone: input.timezone,
        expectedDailyMinutes: input.expectedDailyMinutes,
        effectiveFrom: input.effectiveFrom,
        createdAt: now,
        updatedAt: now,
      }
      await this.db.schedules.add(record)
      return toWorkSchedule(record)
    })
  }

  update(id: string, input: UpdateWorkScheduleInput): Promise<WorkSchedule> {
    return withPersistence(async () => {
      const existing = await this.db.schedules.get(id)
      if (!existing) throw new NotFoundError('WorkSchedule', id)

      const record: WorkScheduleRecord = {
        ...existing,
        ...input,
        periods: (input.periods ?? existing.periods).map((period) => ({ ...period })),
        workweekDays: [...(input.workweekDays ?? existing.workweekDays)],
        updatedAt: new Date().toISOString(),
      }
      await this.db.schedules.put(record)
      return toWorkSchedule(record)
    })
  }

  delete(id: string): Promise<void> {
    return withPersistence(async () => {
      await this.db.schedules.delete(id)
    })
  }
}
