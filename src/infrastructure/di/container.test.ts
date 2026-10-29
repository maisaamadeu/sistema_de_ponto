import { describe, expect, it } from 'vitest'

import { DexieTimeEntryRepository } from '@/infrastructure/persistence/dexie'
import { DexieWorkSettingsRepository } from '@/infrastructure/persistence/dexie'

import { createAppDependencies } from './container'

describe('createAppDependencies', () => {
  it('compõe adapters IndexedDB por padrão', () => {
    const deps = createAppDependencies()

    expect(deps.timeEntries).toBeInstanceOf(DexieTimeEntryRepository)
    expect(deps.workSettings).toBeInstanceOf(DexieWorkSettingsRepository)
  })
})
