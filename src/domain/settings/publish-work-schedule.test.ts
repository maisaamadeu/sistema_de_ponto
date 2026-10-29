import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { calculateWorkDay } from '@/domain/calculation'
import { createAppDependencies } from '@/infrastructure/di/container'
import {
  createPontoDatabase,
  deletePontoDatabase,
  type PontoDatabase,
} from '@/infrastructure/persistence/dexie'
import { ensureGuestWithSchedule } from '@/infrastructure/persistence/dexie/test-helpers'

import { defaultWorkScheduleFormValues } from './schedule-schema'
import { publishWorkSchedule } from './publish-work-schedule'

describe('publishWorkSchedule', () => {
  let db: PontoDatabase
  let dbName: string

  beforeEach(async () => {
    dbName = `ponto-facil-settings-${crypto.randomUUID()}`
    db = createPontoDatabase(dbName)
    await db.open()
  })

  afterEach(async () => {
    db.close()
    await deletePontoDatabase(dbName)
    localStorage.removeItem('ponto-facil.guestUserId')
  })

  it('cria nova versão ao editar e preserva a jornada antiga', async () => {
    const guest = await ensureGuestWithSchedule(db, '2026-01-01')
    const deps = createAppDependencies(db)

    const firstList = await deps.schedules.listByUserId(guest.profile.id)
    expect(firstList).toHaveLength(1)
    const originalId = firstList[0].id
    expect(firstList[0].expectedDailyMinutes).toBe(480)

    const result = await publishWorkSchedule({
      userId: guest.profile.id,
      values: defaultWorkScheduleFormValues({
        uniform: {
          clockIn: '09:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          clockOut: '18:00',
          expectedDailyMinutes: 480,
          expectedManual: false,
        },
        absencePolicy: 'confirm_to_debit',
        theme: 'dark',
      }),
      schedules: deps.schedules,
      preferences: deps.preferences,
      effectiveFrom: '2026-10-29',
      completeOnboarding: true,
    })

    expect(result.createdNewVersion).toBe(true)
    expect(result.schedule.id).not.toBe(originalId)
    expect(result.previousSchedule?.id).toBe(originalId)
    expect(result.preferences.theme).toBe('dark')
    expect(result.preferences.absencePolicy).toBe('confirm_to_debit')
    expect(result.preferences.onboardingCompletedAt).toBeTruthy()

    const all = await deps.schedules.listByUserId(guest.profile.id)
    expect(all).toHaveLength(2)

    const oldEffective = await deps.schedules.getEffectiveOn(
      guest.profile.id,
      '2026-10-28',
    )
    const newEffective = await deps.schedules.getEffectiveOn(
      guest.profile.id,
      '2026-10-29',
    )
    expect(oldEffective?.id).toBe(originalId)
    expect(newEffective?.id).toBe(result.schedule.id)
    expect(oldEffective?.weekdays[0]?.clockIn).toBe('08:00')
    expect(newEffective?.weekdays[0]?.clockIn).toBe('09:00')
  })

  it('preserva expectedMinutes histórico de WorkDay após nova versão', async () => {
    const guest = await ensureGuestWithSchedule(db, '2026-01-01')
    const deps = createAppDependencies(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-28'

    await deps.timeEntries.create({
      userId,
      dateKey,
      type: 'clock_in',
      occurredAt: '2026-10-28T08:00:00.000Z',
    })
    await deps.timeEntries.create({
      userId,
      dateKey,
      type: 'break_start',
      occurredAt: '2026-10-28T12:00:00.000Z',
    })
    await deps.timeEntries.create({
      userId,
      dateKey,
      type: 'break_end',
      occurredAt: '2026-10-28T13:00:00.000Z',
    })
    await deps.timeEntries.create({
      userId,
      dateKey,
      type: 'clock_out',
      occurredAt: '2026-10-28T17:00:00.000Z',
    })

    const before = await deps.workDays.getByUserAndDate(userId, dateKey)
    expect(before?.expectedMinutes).toBe(480)
    expect(before?.expectedFrozen).toBe(true)

    await publishWorkSchedule({
      userId,
      values: defaultWorkScheduleFormValues({
        uniform: {
          clockIn: '10:00',
          breakStart: '12:00',
          breakEnd: '13:00',
          clockOut: '16:00',
          expectedDailyMinutes: 300,
          expectedManual: true,
        },
      }),
      schedules: deps.schedules,
      preferences: deps.preferences,
      effectiveFrom: '2026-10-29',
    })

    const entries = await deps.timeEntries.listByDate(dateKey, userId)
    const scheduleForDay = await deps.schedules.getEffectiveOn(userId, dateKey)
    expect(scheduleForDay?.expectedDailyMinutes).toBe(480)

    const recalculated = calculateWorkDay({
      userId,
      dateKey,
      schedule: scheduleForDay!,
      entries,
      previous: before,
    })
    expect(recalculated.ok).toBe(true)
    if (recalculated.ok) {
      expect(recalculated.value.expectedMinutes).toBe(480)
    }

    const futureSchedule = await deps.schedules.getEffectiveOn(userId, '2026-10-29')
    expect(futureSchedule?.expectedDailyMinutes).toBe(300)
  })
})
