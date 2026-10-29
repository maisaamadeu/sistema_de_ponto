import { describe, expect, it } from 'vitest'

import { DexieTimeEntryRepository } from '@/infrastructure/persistence/dexie'
import { DexieUserProfileRepository } from '@/infrastructure/persistence/dexie'
import { DexieWorkScheduleRepository } from '@/infrastructure/persistence/dexie'

import { createAppDependencies } from './container'

describe('createAppDependencies', () => {
  it('compõe adapters IndexedDB por padrão', () => {
    const deps = createAppDependencies()

    expect(deps.profiles).toBeInstanceOf(DexieUserProfileRepository)
    expect(deps.schedules).toBeInstanceOf(DexieWorkScheduleRepository)
    expect(deps.timeEntries).toBeInstanceOf(DexieTimeEntryRepository)
    expect(typeof deps.ensureGuestSession).toBe('function')
  })
})
