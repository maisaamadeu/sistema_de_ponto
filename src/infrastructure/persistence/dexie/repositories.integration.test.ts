import 'fake-indexeddb/auto'

import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { NotFoundError, StorageUnavailableError } from '@/domain/errors/repository-error'

import { DexieDayOverrideRepository } from './dexie-day-override-repository'
import { DexieTimeEntryRepository } from './dexie-time-entry-repository'
import { DexieUserPreferencesRepository } from './dexie-user-preferences-repository'
import { DexieUserProfileRepository } from './dexie-user-profile-repository'
import { DexieWorkDayRepository } from './dexie-work-day-repository'
import { DexieWorkScheduleRepository } from './dexie-work-schedule-repository'
import { ensureGuestSession } from './guest-session'
import { withPersistence } from './map-persistence-error'
import {
  createPontoDatabase,
  deletePontoDatabase,
  PONTO_DB_SCHEMA_VERSION,
  type PontoDatabase,
} from './ponto-db'
import { ensureGuestWithSchedule } from './test-helpers'

describe('repositórios Dexie (integração)', () => {
  let db: PontoDatabase
  let dbName: string
  let profiles: DexieUserProfileRepository
  let preferences: DexieUserPreferencesRepository
  let schedules: DexieWorkScheduleRepository
  let timeEntries: DexieTimeEntryRepository
  let workDays: DexieWorkDayRepository
  let dayOverrides: DexieDayOverrideRepository

  beforeEach(async () => {
    dbName = `ponto-facil-it-${crypto.randomUUID()}`
    db = createPontoDatabase(dbName)
    await db.open()
    profiles = new DexieUserProfileRepository(db)
    preferences = new DexieUserPreferencesRepository(db)
    schedules = new DexieWorkScheduleRepository(db)
    timeEntries = new DexieTimeEntryRepository(db)
    workDays = new DexieWorkDayRepository(db)
    dayOverrides = new DexieDayOverrideRepository(db)
  })

  afterEach(async () => {
    db.close()
    await deletePontoDatabase(dbName)
    localStorage.removeItem('ponto-facil.guestUserId')
  })

  it('versiona o schema do IndexedDB', async () => {
    expect(db.verno).toBe(PONTO_DB_SCHEMA_VERSION)
    await db.meta.put({ key: 'schemaVersion', value: String(PONTO_DB_SCHEMA_VERSION) })
    const meta = await db.meta.get('schemaVersion')
    expect(meta?.value).toBe(String(PONTO_DB_SCHEMA_VERSION))
  })

  it('bootstrap de convidado cria perfil e preferências sem jornada até o onboarding', async () => {
    const first = await ensureGuestSession(db)
    expect(first.profile.isGuest).toBe(true)
    expect(first.profile.displayName).toBe('Convidado')
    expect(first.preferences.theme).toBe('system')
    expect(first.preferences.absencePolicy).toBe('no_debit')
    expect(first.preferences.onboardingCompletedAt).toBeUndefined()
    expect(first.schedule).toBeNull()

    const second = await ensureGuestSession(db)
    expect(second.profile.id).toBe(first.profile.id)
    expect(second.schedule).toBeNull()
  })

  it('faz CRUD de perfil e preferências', async () => {
    const guest = await ensureGuestSession(db)

    const updatedProfile = await profiles.update(guest.profile.id, {
      displayName: 'Ana Convidada',
    })
    expect(updatedProfile.displayName).toBe('Ana Convidada')

    const updatedPrefs = await preferences.update(guest.profile.id, {
      theme: 'dark',
      absencePolicy: 'auto_debit',
    })
    expect(updatedPrefs.theme).toBe('dark')
    expect(updatedPrefs.absencePolicy).toBe('auto_debit')

    await preferences.delete(guest.profile.id)
    expect(await preferences.getByUserId(guest.profile.id)).toBeNull()
  })

  it('faz CRUD de escala (jornada padrão)', async () => {
    const guest = await ensureGuestSession(db)
    const created = await schedules.create({
      userId: guest.profile.id,
      mode: 'weekday_uniform',
      weekdays: [1, 2, 3, 4, 5].map((weekday) => ({
        weekday: weekday as 1 | 2 | 3 | 4 | 5,
        clockIn: '09:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        clockOut: '18:00',
        expectedDailyMinutes: 480,
        expectedManual: false,
      })),
      periods: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '18:00' },
      ],
      workweekDays: [1, 2, 3, 4, 5],
      timezone: 'America/Sao_Paulo',
      expectedDailyMinutes: 480,
      effectiveFrom: '2026-11-01',
    })

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(created.weekdays).toHaveLength(5)

    const effective = await schedules.getEffectiveOn(guest.profile.id, '2026-11-15')
    expect(effective?.id).toBe(created.id)

    const updated = await schedules.update(created.id, { expectedDailyMinutes: 420 })
    expect(updated.expectedDailyMinutes).toBe(420)

    await schedules.delete(created.id)
    expect(await schedules.getById(created.id)).toBeNull()
  })

  it('cria/consulta/atualiza/exclui marcações e materializa WorkDay em transação', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-28'

    const clockIn = await timeEntries.create({
      userId,
      dateKey,
      type: 'clock_in',
      occurredAt: '2026-10-28T08:00:00.000Z',
    })
    await timeEntries.create({
      userId,
      dateKey,
      type: 'break_start',
      occurredAt: '2026-10-28T12:00:00.000Z',
    })
    await timeEntries.create({
      userId,
      dateKey,
      type: 'break_end',
      occurredAt: '2026-10-28T13:00:00.000Z',
    })
    await timeEntries.create({
      userId,
      dateKey,
      type: 'clock_out',
      occurredAt: '2026-10-28T17:00:00.000Z',
    })

    const dayEntries = await timeEntries.listByDate(dateKey, userId)
    expect(dayEntries).toHaveLength(4)

    const workDay = await workDays.getByUserAndDate(userId, dateKey)
    expect(workDay).not.toBeNull()
    expect(workDay?.kind).toBe('complete')
    expect(workDay?.workedMinutes).toBe(480)
    expect(workDay?.expectedMinutes).toBe(480)
    expect(workDay?.balanceMinutes).toBe(0)
    expect(workDay?.entryIds).toHaveLength(4)
    expect(workDay?.id).toBe(`wd_${userId}_${dateKey}`)

    const updated = await timeEntries.update(clockIn.id, {
      occurredAt: '2026-10-28T08:30:00.000Z',
    })
    expect(updated.occurredAt).toBe('2026-10-28T08:30:00.000Z')

    const afterUpdate = await workDays.getByUserAndDate(userId, dateKey)
    expect(afterUpdate?.workedMinutes).toBe(450)
    expect(afterUpdate?.balanceMinutes).toBe(-30)

    const month = await timeEntries.listByMonth({ year: 2026, month: 10 }, userId)
    expect(month.length).toBeGreaterThanOrEqual(4)

    const remaining = await timeEntries.listByDate(dateKey, userId)
    for (const entry of [...remaining].reverse()) {
      await timeEntries.delete(entry.id)
    }

    expect(await timeEntries.listByDate(dateKey, userId)).toHaveLength(0)
    expect(await workDays.getByUserAndDate(userId, dateKey)).toBeNull()
  })

  it('preserva carga esperada histórica após mudança da escala', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-28'

    await timeEntries.create({
      userId,
      dateKey,
      type: 'clock_in',
      occurredAt: '2026-10-28T08:00:00.000Z',
    })
    await timeEntries.create({
      userId,
      dateKey,
      type: 'clock_out',
      occurredAt: '2026-10-28T16:00:00.000Z',
    })

    const before = await workDays.getByUserAndDate(userId, dateKey)
    expect(before?.expectedMinutes).toBe(480)
    expect(before?.expectedFrozen).toBe(true)

    await schedules.update(guest.schedule.id, { expectedDailyMinutes: 360 })

    // Qualquer mutação de marcação rematerializa preservando expected congelado.
    const entries = await timeEntries.listByDate(dateKey, userId)
    await timeEntries.update(entries[0].id, { note: 'ajuste' })

    const after = await workDays.getByUserAndDate(userId, dateKey)
    expect(after?.expectedMinutes).toBe(480)
    expect(after?.workedMinutes).toBe(480)
  })

  it('override de falta confirmada materializa débito e remove ao excluir', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-29'

    const override = await dayOverrides.create({
      userId,
      dateKey,
      kind: 'confirmed_absence',
    })

    const workDay = await workDays.getByUserAndDate(userId, dateKey)
    expect(workDay?.kind).toBe('confirmed_absence')
    expect(workDay?.balanceMinutes).toBe(-480)
    expect(workDay?.overrideId).toBe(override.id)

    await dayOverrides.delete(override.id)
    expect(await workDays.getByUserAndDate(userId, dateKey)).toBeNull()
  })

  it('lança NotFound ao atualizar marcação inexistente', async () => {
    await expect(
      timeEntries.update('missing', { occurredAt: '2026-10-28T08:00:00.000Z' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('mapeia ausência de IndexedDB para StorageUnavailableError', async () => {
    const original = globalThis.indexedDB
    // @ts-expect-error simula ambiente sem IndexedDB
    globalThis.indexedDB = undefined

    await expect(withPersistence(async () => 'ok')).rejects.toBeInstanceOf(
      StorageUnavailableError,
    )

    globalThis.indexedDB = original
  })

  it('migra schema legado v1 para v2', async () => {
    const legacyName = `ponto-facil-legacy-${crypto.randomUUID()}`

    class LegacyDb extends Dexie {
      timeEntries!: Dexie.Table
      workSettings!: Dexie.Table
      constructor() {
        super(legacyName)
        this.version(1).stores({
          timeEntries: 'id, dateKey, occurredAt, [dateKey+occurredAt]',
          workSettings: 'id',
        })
      }
    }

    const legacy = new LegacyDb()
    await legacy.open()
    await legacy.table('workSettings').put({
      id: 'legacy',
      displayName: 'Antigo',
      workdayStart: '08:00',
      workdayEnd: '17:00',
      breakMinutes: 60,
      expectedDailyMinutes: 480,
      timezone: 'America/Sao_Paulo',
      theme: 'system',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })
    legacy.close()

    const upgraded = createPontoDatabase(legacyName)
    await upgraded.open()
    expect(upgraded.verno).toBe(PONTO_DB_SCHEMA_VERSION)
    expect(upgraded.tables.map((table) => table.name)).toEqual(
      expect.arrayContaining([
        'profiles',
        'preferences',
        'schedules',
        'timeEntries',
        'workDays',
        'dayOverrides',
        'meta',
      ]),
    )
    expect(upgraded.tables.some((table) => table.name === 'workSettings')).toBe(false)

    upgraded.close()
    await deletePontoDatabase(legacyName)
  })
})
