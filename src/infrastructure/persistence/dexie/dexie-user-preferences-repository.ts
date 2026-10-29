import { NotFoundError } from '@/domain/errors/repository-error'
import type { UpdateUserPreferencesInput, UserPreferences } from '@/domain/entities'
import type { UserPreferencesRepository } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { toUserPreferences } from './mappers'
import { getPontoDatabase, type PontoDatabase } from './ponto-db'

export class DexieUserPreferencesRepository implements UserPreferencesRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  getByUserId(userId: string): Promise<UserPreferences | null> {
    return withPersistence(async () => {
      const row = await this.db.preferences.get(userId)
      return row ? toUserPreferences(row) : null
    })
  }

  save(preferences: UserPreferences): Promise<UserPreferences> {
    return withPersistence(async () => {
      await this.db.preferences.put({ ...preferences })
      return preferences
    })
  }

  update(userId: string, input: UpdateUserPreferencesInput): Promise<UserPreferences> {
    return withPersistence(async () => {
      const existing = await this.db.preferences.get(userId)
      if (!existing) throw new NotFoundError('UserPreferences', userId)

      const updated: UserPreferences = {
        ...toUserPreferences(existing),
        ...input,
        updatedAt: new Date().toISOString(),
      }
      await this.db.preferences.put(updated)
      return updated
    })
  }

  delete(userId: string): Promise<void> {
    return withPersistence(async () => {
      await this.db.preferences.delete(userId)
    })
  }
}
