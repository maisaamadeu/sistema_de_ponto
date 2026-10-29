import 'fake-indexeddb/auto'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createBackupDocument } from '@/domain/history'

import { exportFullBackup, importFullBackup } from './backup'
import { DexieTimeEntryRepository } from './dexie-time-entry-repository'
import {
  createPontoDatabase,
  deletePontoDatabase,
  PONTO_DB_SCHEMA_VERSION,
  type PontoDatabase,
} from './ponto-db'
import { ensureGuestWithSchedule } from './test-helpers'

const DB_NAME = 'ponto-facil-backup-test'

describe('exportFullBackup / importFullBackup', () => {
  let db: PontoDatabase

  beforeEach(async () => {
    await deletePontoDatabase(DB_NAME)
    db = createPontoDatabase(DB_NAME)
    await db.open()
  })

  afterEach(async () => {
    db.close()
    await deletePontoDatabase(DB_NAME)
  })

  it('exporta e reimporta preservando entradas', async () => {
    const guest = await ensureGuestWithSchedule(db)
    const entries = new DexieTimeEntryRepository(db)
    await entries.create({
      userId: guest.profile.id,
      dateKey: '2026-10-15',
      type: 'clock_in',
      occurredAt: '2026-10-15T11:00:00.000Z',
    })

    const backup = await exportFullBackup(db)
    expect(backup.format).toBe('ponto-facil-backup')
    expect(backup.version).toBe(1)
    expect(backup.schemaVersion).toBe(PONTO_DB_SCHEMA_VERSION)
    expect(backup.data.timeEntries).toHaveLength(1)

    await db.timeEntries.clear()
    await db.workDays.clear()
    expect(await db.timeEntries.count()).toBe(0)

    await importFullBackup(backup, db)
    expect(await db.timeEntries.count()).toBe(1)
    expect(await db.profiles.count()).toBeGreaterThan(0)
  })

  it('rejeita schemaVersion mais novo que o app', async () => {
    const doc = createBackupDocument({
      schemaVersion: PONTO_DB_SCHEMA_VERSION + 10,
      data: {
        profiles: [],
        preferences: [],
        schedules: [],
        timeEntries: [],
        workDays: [],
        dayOverrides: [],
      },
    })

    await expect(importFullBackup(doc, db)).rejects.toThrow(/schema/i)
  })

  it('rejeita JSON sem schema válido', async () => {
    await expect(importFullBackup({ format: 'x' }, db)).rejects.toThrow()
  })
})
