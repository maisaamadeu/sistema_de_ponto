import { createStableId, GUEST_USER_ID_KEY } from '@/domain/ids'
import type { UserPreferences, UserProfile, WorkSchedule } from '@/domain/entities'
import { StorageUnavailableError } from '@/domain/errors/repository-error'

import { withPersistence } from './map-persistence-error'
import { toUserPreferences, toWorkSchedule } from './mappers'
import { getPontoDatabase, PONTO_DB_SCHEMA_VERSION, type PontoDatabase } from './ponto-db'

export interface GuestSession {
  profile: UserProfile
  preferences: UserPreferences
  /** null até concluir o onboarding inicial. */
  schedule: WorkSchedule | null
}

function readStoredGuestUserId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(GUEST_USER_ID_KEY)
}

function storeGuestUserId(userId: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GUEST_USER_ID_KEY, userId)
}

/**
 * Garante perfil e preferências para uso offline sem login.
 * A jornada só é criada no onboarding — não inventamos escala concluída.
 */
export async function ensureGuestSession(
  db: PontoDatabase = getPontoDatabase(),
): Promise<GuestSession> {
  if (typeof indexedDB === 'undefined') {
    throw new StorageUnavailableError()
  }

  return withPersistence(async () => {
    await db.open()
    await db.meta.put({
      key: 'schemaVersion',
      value: String(PONTO_DB_SCHEMA_VERSION),
    })

    const storedId = readStoredGuestUserId()
    const existingProfile = storedId ? await db.profiles.get(storedId) : null

    if (existingProfile) {
      const [preferencesRow, scheduleRows] = await Promise.all([
        db.preferences.get(existingProfile.id),
        db.schedules.where('userId').equals(existingProfile.id).sortBy('effectiveFrom'),
      ])

      if (preferencesRow) {
        const latest = scheduleRows.at(-1) ?? null
        return {
          profile: existingProfile,
          preferences: toUserPreferences(preferencesRow),
          schedule: latest ? toWorkSchedule(latest) : null,
        }
      }
    }

    const now = new Date().toISOString()
    const userId = existingProfile?.id ?? storedId ?? createStableId()
    const profile: UserProfile = existingProfile ?? {
      id: userId,
      displayName: 'Convidado',
      isGuest: true,
      createdAt: now,
      updatedAt: now,
    }
    const preferences: UserPreferences = {
      userId,
      theme: 'system',
      weekStartsOn: 1,
      absencePolicy: 'no_debit',
      createdAt: now,
      updatedAt: now,
    }

    await db.transaction('rw', db.profiles, db.preferences, db.meta, async () => {
      await db.profiles.put(profile)
      const existingPrefs = await db.preferences.get(userId)
      if (!existingPrefs) {
        await db.preferences.put(preferences)
      }
      await db.meta.put({ key: 'guestUserId', value: userId })
    })

    storeGuestUserId(userId)

    const [prefsRow, scheduleRows] = await Promise.all([
      db.preferences.get(userId),
      db.schedules.where('userId').equals(userId).sortBy('effectiveFrom'),
    ])

    return {
      profile,
      preferences: prefsRow ? toUserPreferences(prefsRow) : preferences,
      schedule: scheduleRows.at(-1) ? toWorkSchedule(scheduleRows.at(-1)!) : null,
    }
  })
}
