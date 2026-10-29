import { createStableId } from '@/domain/ids'
import { NotFoundError } from '@/domain/errors/repository-error'
import type {
  CreateDayOverrideInput,
  DayOverride,
  UpdateDayOverrideInput,
} from '@/domain/entities'
import type { DayOverrideRepository, TimeEntryMonthQuery } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { monthPrefix, toDayOverride } from './mappers'
import { getPontoDatabase, type DayOverrideRecord, type PontoDatabase } from './ponto-db'
import { recalculateWorkDayInTransaction } from './recalculate-work-day'

export class DexieDayOverrideRepository implements DayOverrideRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  getById(id: string): Promise<DayOverride | null> {
    return withPersistence(async () => {
      const row = await this.db.dayOverrides.get(id)
      return row ? toDayOverride(row) : null
    })
  }

  getByUserAndDate(userId: string, dateKey: string): Promise<DayOverride | null> {
    return withPersistence(async () => {
      const row = await this.db.dayOverrides
        .where('[userId+dateKey]')
        .equals([userId, dateKey])
        .first()
      return row ? toDayOverride(row) : null
    })
  }

  listByMonth(userId: string, query: TimeEntryMonthQuery): Promise<DayOverride[]> {
    return withPersistence(async () => {
      const prefix = monthPrefix(query.year, query.month)
      const rows = await this.db.dayOverrides
        .where('userId')
        .equals(userId)
        .sortBy('dateKey')
      return rows.filter((row) => row.dateKey.startsWith(prefix)).map(toDayOverride)
    })
  }

  create(input: CreateDayOverrideInput): Promise<DayOverride> {
    return withPersistence(async () => {
      const now = new Date().toISOString()
      const record: DayOverrideRecord = {
        id: input.id ?? createStableId(),
        userId: input.userId,
        dateKey: input.dateKey,
        kind: input.kind,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      }

      await this.db.transaction(
        'rw',
        this.db.dayOverrides,
        this.db.workDays,
        this.db.timeEntries,
        this.db.schedules,
        async () => {
          const existing = await this.db.dayOverrides
            .where('[userId+dateKey]')
            .equals([record.userId, record.dateKey])
            .first()
          if (existing) {
            await this.db.dayOverrides.delete(existing.id)
          }
          await this.db.dayOverrides.add(record)
          await recalculateWorkDayInTransaction(this.db, record.userId, record.dateKey)
        },
      )

      return toDayOverride(record)
    })
  }

  update(id: string, input: UpdateDayOverrideInput): Promise<DayOverride> {
    return withPersistence(async () => {
      const existing = await this.db.dayOverrides.get(id)
      if (!existing) throw new NotFoundError('DayOverride', id)

      const previousDateKey = existing.dateKey
      const record: DayOverrideRecord = {
        ...existing,
        ...input,
        dateKey: input.dateKey ?? existing.dateKey,
        note:
          input.note === null
            ? undefined
            : input.note !== undefined
              ? input.note
              : existing.note,
        updatedAt: new Date().toISOString(),
      }

      await this.db.transaction(
        'rw',
        this.db.dayOverrides,
        this.db.workDays,
        this.db.timeEntries,
        this.db.schedules,
        async () => {
          await this.db.dayOverrides.put(record)
          await recalculateWorkDayInTransaction(this.db, record.userId, previousDateKey)
          if (previousDateKey !== record.dateKey) {
            await recalculateWorkDayInTransaction(this.db, record.userId, record.dateKey)
          }
        },
      )

      return toDayOverride(record)
    })
  }

  delete(id: string): Promise<void> {
    return withPersistence(async () => {
      const existing = await this.db.dayOverrides.get(id)
      if (!existing) throw new NotFoundError('DayOverride', id)

      await this.db.transaction(
        'rw',
        this.db.dayOverrides,
        this.db.workDays,
        this.db.timeEntries,
        this.db.schedules,
        async () => {
          await this.db.dayOverrides.delete(id)
          await recalculateWorkDayInTransaction(
            this.db,
            existing.userId,
            existing.dateKey,
          )
        },
      )
    })
  }
}
