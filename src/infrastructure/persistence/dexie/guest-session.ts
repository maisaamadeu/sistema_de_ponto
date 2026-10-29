import { createStableId, GUEST_USER_ID_KEY } from '@/domain/ids'
import type { UserPreferences, UserProfile, WorkSchedule } from '@/domain/entities'
import { StorageUnavailableError } from '@/domain/errors/repository-error'

import { withPersistence } from './map-persistence-error'
import { getPontoDatabase, PONTO_DB_SCHEMA_VERSION, type PontoDatabase } from './ponto-db'

export interface GuestSession {
  profile: UserProfile
  preferences: UserPreferences
  schedule: WorkSchedule
}

function readStoredGuestUserId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(GUEST_USER_ID_KEY)
}

function storeGuestUserId(userId: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(GUEST_USER_ID_KEY, userId)
}

function defaultSchedule(userId: string, now: string): WorkSchedule {
  return {
    id: createStableId(),
    userId,
    periods: [
      { start: '08:00', end: '12:00' },
      { start: '13:00', end: '17:00' },
    ],
    workweekDays: [1, 2, 3, 4, 5],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    expectedDailyMinutes: 480,
    effectiveFrom: '1970-01-01',
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Garante perfil, preferências e escala padrão para uso offline sem login.
 * Idempotente: reutiliza o mesmo userId estável entre sessões do navegador.
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
      const [preferences, schedules] = await Promise.all([
        db.preferences.get(existingProfile.id),
        db.schedules.where('userId').equals(existingProfile.id).sortBy('effectiveFrom'),
      ])

      if (preferences && schedules[0]) {
        return {
          profile: existingProfile,
          preferences,
          schedule: {
            ...schedules[0],
            periods: schedules[0].periods.map((period) => ({ ...period })),
            workweekDays: [...schedules[0].workweekDays],
          },
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
      createdAt: now,
      updatedAt: now,
    }
    const schedule = defaultSchedule(userId, now)

    await db.transaction(
      'rw',
      db.profiles,
      db.preferences,
      db.schedules,
      db.meta,
      async () => {
        await db.profiles.put(profile)
        await db.preferences.put(preferences)
        const hasSchedule =
          (await db.schedules.where('userId').equals(userId).count()) > 0
        if (!hasSchedule) {
          await db.schedules.add({
            ...schedule,
            periods: schedule.periods.map((period) => ({ ...period })),
            workweekDays: [...schedule.workweekDays],
          })
        }
        await db.meta.put({ key: 'guestUserId', value: userId })
      },
    )

    storeGuestUserId(userId)

    const persistedSchedule =
      (await db.schedules.where('userId').equals(userId).first()) ?? schedule

    return {
      profile,
      preferences: (await db.preferences.get(userId)) ?? preferences,
      schedule: {
        ...persistedSchedule,
        periods: persistedSchedule.periods.map((period) => ({ ...period })),
        workweekDays: [...persistedSchedule.workweekDays],
      },
    }
  })
}
