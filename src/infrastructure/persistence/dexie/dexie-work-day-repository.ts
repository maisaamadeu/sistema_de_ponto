import { NotFoundError } from '@/domain/errors/repository-error'
import type { WorkDay } from '@/domain/entities'
import type { TimeEntryMonthQuery, WorkDayRepository } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { monthPrefix, toWorkDay } from './mappers'
import { getPontoDatabase, type PontoDatabase, type WorkDayRecord } from './ponto-db'

export class DexieWorkDayRepository implements WorkDayRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  getById(id: string): Promise<WorkDay | null> {
    return withPersistence(async () => {
      const row = await this.db.workDays.get(id)
      return row ? toWorkDay(row) : null
    })
  }

  getByUserAndDate(userId: string, dateKey: string): Promise<WorkDay | null> {
    return withPersistence(async () => {
      const row = await this.db.workDays
        .where('[userId+dateKey]')
        .equals([userId, dateKey])
        .first()
      return row ? toWorkDay(row) : null
    })
  }

  listByMonth(userId: string, query: TimeEntryMonthQuery): Promise<WorkDay[]> {
    return withPersistence(async () => {
      const prefix = monthPrefix(query.year, query.month)
      const rows = await this.db.workDays.where('userId').equals(userId).sortBy('dateKey')
      return rows.filter((row) => row.dateKey.startsWith(prefix)).map(toWorkDay)
    })
  }

  save(workDay: WorkDay): Promise<WorkDay> {
    return withPersistence(async () => {
      const record: WorkDayRecord = {
        ...workDay,
        entryIds: [...workDay.entryIds],
      }
      await this.db.workDays.put(record)
      return toWorkDay(record)
    })
  }

  delete(id: string): Promise<void> {
    return withPersistence(async () => {
      const existing = await this.db.workDays.get(id)
      if (!existing) throw new NotFoundError('WorkDay', id)
      await this.db.workDays.delete(id)
    })
  }

  deleteByUserAndDate(userId: string, dateKey: string): Promise<void> {
    return withPersistence(async () => {
      await this.db.workDays.where('[userId+dateKey]').equals([userId, dateKey]).delete()
    })
  }
}
