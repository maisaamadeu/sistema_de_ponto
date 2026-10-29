import { NotImplementedError } from '@/domain/errors/repository-error'
import type { UpdateWorkSettingsInput, WorkSettings } from '@/domain/entities'
import type { WorkSettingsRepository } from '@/domain/repositories'

import { getPontoDatabase, type WorkSettingsRecord } from './ponto-db'

function toDomain(record: WorkSettingsRecord): WorkSettings {
  return {
    id: record.id,
    displayName: record.displayName,
    workdayStart: record.workdayStart,
    workdayEnd: record.workdayEnd,
    breakMinutes: record.breakMinutes,
    expectedDailyMinutes: record.expectedDailyMinutes,
    timezone: record.timezone,
    theme: record.theme,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export class DexieWorkSettingsRepository implements WorkSettingsRepository {
  private readonly db: ReturnType<typeof getPontoDatabase>

  constructor(db = getPontoDatabase()) {
    this.db = db
  }

  async get(): Promise<WorkSettings | null> {
    const row = await this.db.workSettings.toCollection().first()
    return row ? toDomain(row) : null
  }

  async save(_input: UpdateWorkSettingsInput): Promise<WorkSettings> {
    throw new NotImplementedError('WorkSettingsRepository.save')
  }

  async clear(): Promise<void> {
    await this.db.workSettings.clear()
  }
}
