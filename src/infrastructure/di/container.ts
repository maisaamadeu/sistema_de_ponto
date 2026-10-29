import type {
  DayOverrideRepository,
  TimeEntryRepository,
  UserPreferencesRepository,
  UserProfileRepository,
  WorkDayRepository,
  WorkScheduleRepository,
} from '@/domain/repositories'
import {
  DexieDayOverrideRepository,
  DexieTimeEntryRepository,
  DexieUserPreferencesRepository,
  DexieUserProfileRepository,
  DexieWorkDayRepository,
  DexieWorkScheduleRepository,
  ensureGuestSession,
  getPontoDatabase,
  type GuestSession,
  type PontoDatabase,
} from '@/infrastructure/persistence/dexie'

/**
 * Composition root.
 * Para migrar para Firestore, substitua apenas as instâncias abaixo.
 */
export interface AppDependencies {
  db: PontoDatabase
  profiles: UserProfileRepository
  preferences: UserPreferencesRepository
  schedules: WorkScheduleRepository
  timeEntries: TimeEntryRepository
  workDays: WorkDayRepository
  dayOverrides: DayOverrideRepository
  ensureGuestSession: () => Promise<GuestSession>
}

export function createAppDependencies(
  db: PontoDatabase = getPontoDatabase(),
): AppDependencies {
  return {
    db,
    profiles: new DexieUserProfileRepository(db),
    preferences: new DexieUserPreferencesRepository(db),
    schedules: new DexieWorkScheduleRepository(db),
    timeEntries: new DexieTimeEntryRepository(db),
    workDays: new DexieWorkDayRepository(db),
    dayOverrides: new DexieDayOverrideRepository(db),
    ensureGuestSession: () => ensureGuestSession(db),
  }
}

let dependencies: AppDependencies | null = null

export function getAppDependencies(): AppDependencies {
  dependencies ??= createAppDependencies()
  return dependencies
}

export function setAppDependenciesForTests(next: AppDependencies | null): void {
  dependencies = next
}
