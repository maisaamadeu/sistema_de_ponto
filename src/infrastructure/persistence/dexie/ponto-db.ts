import Dexie, { type EntityTable, type Table } from 'dexie'

import type {
  DayKind,
  DayOverrideKind,
  PunchType,
  ThemePreference,
  WorkPeriod,
} from '@/domain/entities'

/** Versão atual do schema IndexedDB. */
export const PONTO_DB_SCHEMA_VERSION = 2

export interface UserProfileRecord {
  id: string
  displayName: string
  email?: string
  isGuest: boolean
  createdAt: string
  updatedAt: string
}

export interface UserPreferencesRecord {
  userId: string
  theme: ThemePreference
  weekStartsOn: 0 | 1
  createdAt: string
  updatedAt: string
}

export interface WorkScheduleRecord {
  id: string
  userId: string
  periods: WorkPeriod[]
  workweekDays: Array<0 | 1 | 2 | 3 | 4 | 5 | 6>
  timezone: string
  expectedDailyMinutes?: number
  effectiveFrom: string
  createdAt: string
  updatedAt: string
}

export interface TimeEntryRecord {
  id: string
  userId: string
  dateKey: string
  type: PunchType
  occurredAt: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface WorkDayRecord {
  id: string
  userId: string
  dateKey: string
  kind: DayKind
  expectedMinutes: number
  workedMinutes: number
  balanceMinutes: number
  entryIds: string[]
  overrideId?: string
  expectedFrozen: boolean
  createdAt: string
  updatedAt: string
}

export interface DayOverrideRecord {
  id: string
  userId: string
  dateKey: string
  kind: DayOverrideKind
  note?: string
  createdAt: string
  updatedAt: string
}

export interface MetaRecord {
  key: string
  value: string
}

/**
 * Banco local versionado.
 * v1: timeEntries + workSettings (legado da base)
 * v2: modelo de domínio completo para modo convidado
 */
export class PontoDatabase extends Dexie {
  profiles!: EntityTable<UserProfileRecord, 'id'>
  preferences!: EntityTable<UserPreferencesRecord, 'userId'>
  schedules!: EntityTable<WorkScheduleRecord, 'id'>
  timeEntries!: EntityTable<TimeEntryRecord, 'id'>
  workDays!: EntityTable<WorkDayRecord, 'id'>
  dayOverrides!: EntityTable<DayOverrideRecord, 'id'>
  meta!: EntityTable<MetaRecord, 'key'>

  /** Tabela legada — removida no upgrade para v2. */
  workSettings!: Table

  constructor(name = 'ponto-facil') {
    super(name)

    this.version(1).stores({
      timeEntries: 'id, dateKey, occurredAt, [dateKey+occurredAt]',
      workSettings: 'id',
    })

    this.version(PONTO_DB_SCHEMA_VERSION)
      .stores({
        timeEntries:
          'id, userId, dateKey, occurredAt, [userId+dateKey], [userId+dateKey+occurredAt]',
        workSettings: null,
        profiles: 'id, isGuest',
        preferences: 'userId',
        schedules: 'id, userId, effectiveFrom, [userId+effectiveFrom]',
        workDays: 'id, userId, dateKey, [userId+dateKey]',
        dayOverrides: 'id, userId, dateKey, [userId+dateKey]',
        meta: 'key',
      })
      .upgrade(async (tx) => {
        // Garante meta de versão mesmo em upgrades a partir de v1 vazia/parcial.
        await tx.table('meta').put({
          key: 'schemaVersion',
          value: String(PONTO_DB_SCHEMA_VERSION),
        })
      })
  }
}

let database: PontoDatabase | null = null

export function createPontoDatabase(name = 'ponto-facil'): PontoDatabase {
  return new PontoDatabase(name)
}

export function getPontoDatabase(): PontoDatabase {
  database ??= createPontoDatabase()
  return database
}

export async function resetPontoDatabaseForTests(
  name = `ponto-facil-test-${crypto.randomUUID()}`,
): Promise<PontoDatabase> {
  if (database) {
    database.close()
    database = null
  }
  await Dexie.delete(name).catch(() => undefined)
  database = createPontoDatabase(name)
  await database.open()
  return database
}

export async function deletePontoDatabase(name?: string): Promise<void> {
  const target = name ?? database?.name ?? 'ponto-facil'
  if (database && database.name === target) {
    database.close()
    database = null
  }
  await Dexie.delete(target)
}
