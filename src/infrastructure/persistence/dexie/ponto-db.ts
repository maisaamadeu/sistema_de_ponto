import Dexie, { type EntityTable, type Table } from 'dexie'

import type {
  AbsencePolicy,
  DayKind,
  DayOverrideKind,
  PunchType,
  ScheduleMode,
  ThemePreference,
  Weekday,
  WeekdaySchedule,
  WorkPeriod,
} from '@/domain/entities'

/** Versão atual do schema IndexedDB. */
export const PONTO_DB_SCHEMA_VERSION = 3

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
  absencePolicy?: AbsencePolicy
  onboardingCompletedAt?: string
  createdAt: string
  updatedAt: string
}

export interface WorkScheduleRecord {
  id: string
  userId: string
  mode?: ScheduleMode
  weekdays?: WeekdaySchedule[]
  periods: WorkPeriod[]
  workweekDays: Weekday[]
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
 * v3: jornada por dia da semana + preferências de falta/onboarding
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

    this.version(2)
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
        await tx.table('meta').put({
          key: 'schemaVersion',
          value: '2',
        })
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
        const prefs = tx.table<UserPreferencesRecord>('preferences')
        await prefs.toCollection().modify((row) => {
          if (!row.absencePolicy) row.absencePolicy = 'no_debit'
        })

        const schedules = tx.table<WorkScheduleRecord>('schedules')
        await schedules.toCollection().modify((row) => {
          if (!row.mode) row.mode = 'weekday_uniform'
          if (!row.weekdays || row.weekdays.length === 0) {
            const morning = row.periods[0] ?? { start: '08:00', end: '12:00' }
            const afternoon = row.periods[1] ?? { start: '13:00', end: '17:00' }
            const expected =
              row.expectedDailyMinutes ??
              (() => {
                const toMin = (t: string) => {
                  const [h, m] = t.split(':').map(Number)
                  return h * 60 + m
                }
                return (
                  toMin(morning.end) -
                  toMin(morning.start) +
                  (toMin(afternoon.end) - toMin(afternoon.start))
                )
              })()
            row.weekdays = row.workweekDays.map((weekday) => ({
              weekday,
              clockIn: morning.start,
              breakStart: morning.end,
              breakEnd: afternoon.start,
              clockOut: afternoon.end,
              expectedDailyMinutes: expected,
              expectedManual: row.expectedDailyMinutes !== undefined,
            }))
          }
        })

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
