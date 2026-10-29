import { createStableId } from '@/domain/ids'
import { NotFoundError } from '@/domain/errors/repository-error'
import type {
  CreateTimeEntryInput,
  TimeEntry,
  UpdateTimeEntryInput,
} from '@/domain/entities'
import type { TimeEntryMonthQuery, TimeEntryRepository } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { monthPrefix, toTimeEntry } from './mappers'
import { getPontoDatabase, type PontoDatabase, type TimeEntryRecord } from './ponto-db'
import { recalculateWorkDayInTransaction } from './recalculate-work-day'

export class DexieTimeEntryRepository implements TimeEntryRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  listByDate(dateKey: string, userId: string): Promise<TimeEntry[]> {
    return withPersistence(async () => {
      const rows = await this.db.timeEntries
        .where('[userId+dateKey]')
        .equals([userId, dateKey])
        .sortBy('occurredAt')
      return rows.map(toTimeEntry)
    })
  }

  listByMonth(query: TimeEntryMonthQuery, userId: string): Promise<TimeEntry[]> {
    return withPersistence(async () => {
      const prefix = monthPrefix(query.year, query.month)
      const rows = await this.db.timeEntries
        .where('userId')
        .equals(userId)
        .sortBy('occurredAt')
      return rows.filter((row) => row.dateKey.startsWith(prefix)).map(toTimeEntry)
    })
  }

  getById(id: string): Promise<TimeEntry | null> {
    return withPersistence(async () => {
      const row = await this.db.timeEntries.get(id)
      return row ? toTimeEntry(row) : null
    })
  }

  create(input: CreateTimeEntryInput): Promise<TimeEntry> {
    return withPersistence(async () => {
      const now = new Date().toISOString()
      const record: TimeEntryRecord = {
        id: createStableId(),
        userId: input.userId,
        dateKey: input.dateKey,
        type: input.type,
        occurredAt: input.occurredAt,
        note: input.note,
        createdAt: now,
        updatedAt: now,
      }

      await this.db.transaction(
        'rw',
        this.db.timeEntries,
        this.db.workDays,
        this.db.schedules,
        this.db.dayOverrides,
        async () => {
          await this.db.timeEntries.add(record)
          await recalculateWorkDayInTransaction(this.db, record.userId, record.dateKey)
        },
      )

      return toTimeEntry(record)
    })
  }

  update(id: string, input: UpdateTimeEntryInput): Promise<TimeEntry> {
    return withPersistence(async () => {
      const existing = await this.db.timeEntries.get(id)
      if (!existing) throw new NotFoundError('TimeEntry', id)

      const previousDateKey = existing.dateKey
      const nextDateKey = input.dateKey ?? existing.dateKey
      const record: TimeEntryRecord = {
        ...existing,
        occurredAt: input.occurredAt ?? existing.occurredAt,
        type: input.type ?? existing.type,
        dateKey: nextDateKey,
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
        this.db.timeEntries,
        this.db.workDays,
        this.db.schedules,
        this.db.dayOverrides,
        async () => {
          await this.db.timeEntries.put(record)
          await recalculateWorkDayInTransaction(this.db, record.userId, previousDateKey)
          if (previousDateKey !== nextDateKey) {
            await recalculateWorkDayInTransaction(this.db, record.userId, nextDateKey)
          }
        },
      )

      return toTimeEntry(record)
    })
  }

  delete(id: string): Promise<void> {
    return withPersistence(async () => {
      const existing = await this.db.timeEntries.get(id)
      if (!existing) throw new NotFoundError('TimeEntry', id)

      await this.db.transaction(
        'rw',
        this.db.timeEntries,
        this.db.workDays,
        this.db.schedules,
        this.db.dayOverrides,
        async () => {
          await this.db.timeEntries.delete(id)
          await recalculateWorkDayInTransaction(
            this.db,
            existing.userId,
            existing.dateKey,
            {
              softInvalidSequence: true,
            },
          )
        },
      )
    })
  }
}
