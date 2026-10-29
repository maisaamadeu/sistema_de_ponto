import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createAppDependencies } from '@/infrastructure/di/container'
import {
  createPontoDatabase,
  deletePontoDatabase,
  type PontoDatabase,
} from '@/infrastructure/persistence/dexie'
import { ensureGuestWithSchedule } from '@/infrastructure/persistence/dexie/test-helpers'
import { calculateWorkDay } from '@/domain/calculation'

import { calculateLiveWorkDay, registerPunch } from './register-punch'
import { derivePrimaryPunch } from './next-punch'

describe('registerPunch + live calculation', () => {
  let db: PontoDatabase
  let dbName: string

  beforeEach(async () => {
    dbName = `ponto-facil-dash-${crypto.randomUUID()}`
    db = createPontoDatabase(dbName)
    await db.open()
  })

  afterEach(async () => {
    db.close()
    await deletePontoDatabase(dbName)
    localStorage.removeItem('ponto-facil.guestUserId')
  })

  it('persiste o ciclo completo e rejeita clique inválido', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const deps = createAppDependencies(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-29'

    let entries = await deps.timeEntries.listByDate(dateKey, userId)
    expect(derivePrimaryPunch(entries).type).toBe('clock_in')

    const inResult = await registerPunch({
      userId,
      dateKey,
      type: 'clock_in',
      occurredAt: '2026-10-29T11:00:00.000Z',
      existingEntries: entries,
      timeEntries: deps.timeEntries,
    })
    entries = inResult.entries
    expect(derivePrimaryPunch(entries).type).toBe('break_start')

    await expect(
      registerPunch({
        userId,
        dateKey,
        type: 'break_end',
        occurredAt: '2026-10-29T12:00:00.000Z',
        existingEntries: entries,
        timeEntries: deps.timeEntries,
      }),
    ).rejects.toThrow(/intervalo/i)

    for (const step of [
      { type: 'break_start' as const, at: '2026-10-29T15:00:00.000Z' },
      { type: 'break_end' as const, at: '2026-10-29T16:00:00.000Z' },
      { type: 'clock_out' as const, at: '2026-10-29T20:00:00.000Z' },
    ]) {
      const result = await registerPunch({
        userId,
        dateKey,
        type: step.type,
        occurredAt: step.at,
        existingEntries: entries,
        timeEntries: deps.timeEntries,
      })
      entries = result.entries
    }

    expect(derivePrimaryPunch(entries).type).toBe('clock_in')
    const day = await deps.workDays.getByUserAndDate(userId, dateKey)
    expect(day?.kind).toBe('complete')
    expect(day?.workedMinutes).toBe(480)
  })

  it('atualiza tempo ao vivo sem gravar continuamente', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const deps = createAppDependencies(db)
    const userId = guest.profile.id
    const dateKey = '2026-10-29'

    await registerPunch({
      userId,
      dateKey,
      type: 'clock_in',
      occurredAt: '2026-10-29T11:00:00.000Z',
      existingEntries: [],
      timeEntries: deps.timeEntries,
    })

    const entries = await deps.timeEntries.listByDate(dateKey, userId)
    const schedule = guest.schedule

    const live30 = calculateLiveWorkDay({
      userId,
      dateKey,
      schedule,
      entries,
      asOfIso: '2026-10-29T11:30:00.000Z',
    })
    expect(live30?.workedMinutes).toBe(30)

    const live60 = calculateLiveWorkDay({
      userId,
      dateKey,
      schedule,
      entries,
      asOfIso: '2026-10-29T12:00:00.000Z',
    })
    expect(live60?.workedMinutes).toBe(60)

    // Banco não ganhou novas marcações só pelo “tick” ao vivo.
    expect(await deps.timeEntries.listByDate(dateKey, userId)).toHaveLength(1)

    // Materializado permanece incompleto até a saída.
    const persisted = await deps.workDays.getByUserAndDate(userId, dateKey)
    const rematerialized = calculateWorkDay({
      userId,
      dateKey,
      schedule,
      entries,
      previous: persisted,
      asOfIso: '2026-10-29T12:00:00.000Z',
    })
    expect(rematerialized.ok && rematerialized.value.kind).toBe('incomplete')
  })
})
