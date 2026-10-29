import Dexie, { type EntityTable } from 'dexie'

import type { PunchType } from '@/domain/entities'

/**
 * Registros brutos do IndexedDB. O mapeamento para entidades de domínio
 * ocorre nos adapters de repositório (etapa seguinte).
 */
export interface TimeEntryRecord {
  id: string
  dateKey: string
  type: PunchType
  occurredAt: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface WorkSettingsRecord {
  id: string
  displayName: string
  workdayStart: string
  workdayEnd: string
  breakMinutes: number
  expectedDailyMinutes: number
  timezone: string
  theme: 'system' | 'light' | 'dark'
  createdAt: string
  updatedAt: string
}

export class PontoDatabase extends Dexie {
  timeEntries!: EntityTable<TimeEntryRecord, 'id'>
  workSettings!: EntityTable<WorkSettingsRecord, 'id'>

  constructor(name = 'ponto-facil') {
    super(name)

    this.version(1).stores({
      timeEntries: 'id, dateKey, occurredAt, [dateKey+occurredAt]',
      workSettings: 'id',
    })
  }
}

let database: PontoDatabase | null = null

export function getPontoDatabase(): PontoDatabase {
  database ??= new PontoDatabase()
  return database
}

export function resetPontoDatabaseForTests(): void {
  database = null
}
