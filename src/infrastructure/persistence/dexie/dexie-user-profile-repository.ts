import { NotFoundError } from '@/domain/errors/repository-error'
import type { UpdateUserProfileInput, UserProfile } from '@/domain/entities'
import type { UserProfileRepository } from '@/domain/repositories'

import { withPersistence } from './map-persistence-error'
import { toUserProfile } from './mappers'
import { getPontoDatabase, type PontoDatabase } from './ponto-db'

export class DexieUserProfileRepository implements UserProfileRepository {
  private readonly db: PontoDatabase

  constructor(db: PontoDatabase = getPontoDatabase()) {
    this.db = db
  }

  getById(id: string): Promise<UserProfile | null> {
    return withPersistence(async () => {
      const row = await this.db.profiles.get(id)
      return row ? toUserProfile(row) : null
    })
  }

  save(profile: UserProfile): Promise<UserProfile> {
    return withPersistence(async () => {
      await this.db.profiles.put({ ...profile })
      return profile
    })
  }

  update(id: string, input: UpdateUserProfileInput): Promise<UserProfile> {
    return withPersistence(async () => {
      const existing = await this.db.profiles.get(id)
      if (!existing) throw new NotFoundError('UserProfile', id)

      const updated: UserProfile = {
        ...toUserProfile(existing),
        ...input,
        updatedAt: new Date().toISOString(),
      }
      await this.db.profiles.put(updated)
      return updated
    })
  }

  delete(id: string): Promise<void> {
    return withPersistence(async () => {
      await this.db.profiles.delete(id)
    })
  }
}
