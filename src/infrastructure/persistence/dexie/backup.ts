import {
  createBackupDocument,
  parseBackupJson,
  type BackupDocument,
} from '@/domain/history'
import { GUEST_USER_ID_KEY } from '@/domain/ids'

import { withPersistence } from './map-persistence-error'
import {
  getPontoDatabase,
  PONTO_DB_SCHEMA_VERSION,
  type PontoDatabase,
} from './ponto-db'

export async function exportFullBackup(
  db: PontoDatabase = getPontoDatabase(),
): Promise<BackupDocument> {
  return withPersistence(async () => {
    await db.open()
    const [
      profiles,
      preferences,
      schedules,
      timeEntries,
      workDays,
      dayOverrides,
      meta,
    ] = await Promise.all([
      db.profiles.toArray(),
      db.preferences.toArray(),
      db.schedules.toArray(),
      db.timeEntries.toArray(),
      db.workDays.toArray(),
      db.dayOverrides.toArray(),
      db.meta.toArray(),
    ])

    return createBackupDocument({
      schemaVersion: PONTO_DB_SCHEMA_VERSION,
      data: {
        profiles,
        preferences,
        schedules,
        timeEntries,
        workDays,
        dayOverrides,
        meta,
      },
    })
  })
}

/**
 * Importa backup após validar schema/versão.
 * Substitui os dados locais do usuário (modo convidado).
 */
export async function importFullBackup(
  raw: unknown,
  db: PontoDatabase = getPontoDatabase(),
): Promise<BackupDocument> {
  const parsed = parseBackupJson(raw)
  if (!parsed.ok) {
    throw new Error(parsed.message)
  }

  const doc = parsed.value
  if (doc.schemaVersion > PONTO_DB_SCHEMA_VERSION) {
    throw new Error(
      `Backup de schema ${doc.schemaVersion} é mais novo que este app (${PONTO_DB_SCHEMA_VERSION}). Atualize o Ponto Fácil.`,
    )
  }

  return withPersistence(async () => {
    await db.open()
    await db.transaction(
      'rw',
      [
        db.profiles,
        db.preferences,
        db.schedules,
        db.timeEntries,
        db.workDays,
        db.dayOverrides,
        db.meta,
      ],
      async () => {
        await Promise.all([
          db.profiles.clear(),
          db.preferences.clear(),
          db.schedules.clear(),
          db.timeEntries.clear(),
          db.workDays.clear(),
          db.dayOverrides.clear(),
          db.meta.clear(),
        ])

        if (doc.data.profiles.length) await db.profiles.bulkPut(doc.data.profiles)
        if (doc.data.preferences.length) {
          await db.preferences.bulkPut(doc.data.preferences)
        }
        if (doc.data.schedules.length) await db.schedules.bulkPut(doc.data.schedules)
        if (doc.data.timeEntries.length) {
          await db.timeEntries.bulkPut(doc.data.timeEntries)
        }
        if (doc.data.workDays.length) await db.workDays.bulkPut(doc.data.workDays)
        if (doc.data.dayOverrides.length) {
          await db.dayOverrides.bulkPut(doc.data.dayOverrides)
        }
        if (doc.data.meta?.length) await db.meta.bulkPut(doc.data.meta)

        await db.meta.put({
          key: 'schemaVersion',
          value: String(PONTO_DB_SCHEMA_VERSION),
        })

        const guestId = doc.data.profiles.find((p) => p.isGuest)?.id
        if (guestId && typeof localStorage !== 'undefined') {
          localStorage.setItem(GUEST_USER_ID_KEY, guestId)
          await db.meta.put({ key: 'guestUserId', value: guestId })
        }
      },
    )

    return doc
  })
}
