import type { TimeEntryRepository, WorkSettingsRepository } from '@/domain/repositories'
import {
  DexieTimeEntryRepository,
  DexieWorkSettingsRepository,
} from '@/infrastructure/persistence/dexie'

/**
 * Composition root mínimo.
 * Para migrar para Firestore, substitua apenas as instâncias abaixo.
 */
export interface AppDependencies {
  timeEntries: TimeEntryRepository
  workSettings: WorkSettingsRepository
}

export function createAppDependencies(): AppDependencies {
  return {
    timeEntries: new DexieTimeEntryRepository(),
    workSettings: new DexieWorkSettingsRepository(),
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
